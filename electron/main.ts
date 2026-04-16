import { app, BrowserWindow, dialog, ipcMain, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import type { OutputFormat, ResizeItemResult, ResizeRequest, ResizeResponse } from '../src/shared/contracts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  const publicDir = process.env.VITE_PUBLIC ?? process.env.APP_ROOT ?? __dirname

  win = new BrowserWindow({
    icon: path.join(publicDir, 'drop-resize.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

ipcMain.handle('files:pick-images', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select images',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif'] },
    ],
  })

  if (result.canceled) {
    return []
  }

  return result.filePaths
})

ipcMain.handle('files:pick-output-dir', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose output folder',
    properties: ['openDirectory', 'createDirectory'],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('images:resize', async (_event, request: ResizeRequest): Promise<ResizeResponse> => {
  const results: ResizeItemResult[] = []

  for (const inputPath of request.files) {
    try {
      const image = nativeImage.createFromPath(inputPath)
      if (image.isEmpty()) {
        results.push({
          inputPath,
          success: false,
          message: 'Unable to decode image data',
        })
        continue
      }

      const inputSize = image.getSize()
      const outputSize = request.mode === 'exact'
        ? { width: request.width, height: request.height }
        : fitContain(inputSize.width, inputSize.height, request.width, request.height)

      const resized = image.resize({
        width: Math.max(1, outputSize.width),
        height: Math.max(1, outputSize.height),
        quality: 'best',
      })

      const ext = chooseOutputExtension(inputPath, request.format)
      const fileBase = path.parse(inputPath).name
      const targetDir = request.outputDir && request.outputDir.trim().length > 0
        ? request.outputDir
        : path.dirname(inputPath)

      await mkdir(targetDir, { recursive: true })

      const outputFileName = renderOutputFileName(request.outputNameTemplate, {
        filename: fileBase,
        extension: ext,
        width: outputSize.width,
        height: outputSize.height,
      })

      const outputPath = path.join(targetDir, outputFileName)

      const data = ext === 'jpg' || ext === 'jpeg'
        ? resized.toJPEG(clampJpegQuality(request.jpegQuality))
        : resized.toPNG()

      await writeFile(outputPath, data)

      results.push({
        inputPath,
        outputPath,
        success: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown resize failure'
      results.push({
        inputPath,
        success: false,
        message,
      })
    }
  }

  const successCount = results.filter((item) => item.success).length
  const failureCount = results.length - successCount

  return {
    successCount,
    failureCount,
    results,
  }
})

function chooseOutputExtension(inputPath: string, format: OutputFormat): 'png' | 'jpg' | 'jpeg' {
  if (format === 'png') {
    return 'png'
  }

  if (format === 'jpeg') {
    return 'jpg'
  }

  const ext = path.extname(inputPath).toLowerCase().replace('.', '')
  if (ext === 'jpg' || ext === 'jpeg') {
    return ext
  }

  if (ext === 'png') {
    return 'png'
  }

  return 'png'
}

function clampJpegQuality(input: number): number {
  return Math.max(1, Math.min(100, Math.round(input)))
}

function fitContain(sourceWidth: number, sourceHeight: number, maxWidth: number, maxHeight: number) {
  const width = Math.max(1, maxWidth)
  const height = Math.max(1, maxHeight)

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width, height }
  }

  const ratio = Math.min(width / sourceWidth, height / sourceHeight)
  return {
    width: Math.max(1, Math.round(sourceWidth * ratio)),
    height: Math.max(1, Math.round(sourceHeight * ratio)),
  }
}

function renderOutputFileName(
  template: string,
  values: { filename: string; extension: string; width: number; height: number },
): string {
  const resolvedTemplate = template.trim().length > 0
    ? template
    : '{filename}-{width}x{height}.{extension}'

  const rendered = resolvedTemplate
    .replace(/\{filename\}/g, values.filename)
    .replace(/\{extension\}/g, values.extension)
    .replace(/\{width\}/g, String(values.width))
    .replace(/\{height\}/g, String(values.height))

  const safeName = sanitizeFileName(rendered)
  return safeName.trim().length > 0
    ? safeName
    : `${values.filename}-${values.width}x${values.height}.${values.extension}`
}

function sanitizeFileName(name: string): string {
  // Remove path separators and reserved characters to avoid escaping the target directory.
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\u0000-\u001f]/g, '')
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
