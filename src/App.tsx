import { useMemo, useState } from 'react'
import type { OutputFormat, ResizeMode, ResizeRequest, ResizeResponse } from './shared/contracts'
import './App.css'

function App() {
  const [files, setFiles] = useState<string[]>([])
  const [outputDir, setOutputDir] = useState('')
  const [outputNameTemplate, setOutputNameTemplate] = useState('{filename}-resized.{extension}')
  const [width, setWidth] = useState(1900)
  const [height, setHeight] = useState(1900)
  const [mode, setMode] = useState<ResizeMode>('contain')
  const [format, setFormat] = useState<OutputFormat>('keep')
  const [jpegQuality, setJpegQuality] = useState(85)
  const [isDragging, setIsDragging] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [result, setResult] = useState<ResizeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canRun = files.length > 0 && width > 0 && height > 0 && !isRunning

  const summary = useMemo(() => {
    if (!result) {
      return null
    }
    return `${result.successCount} resized, ${result.failureCount} failed`
  }, [result])

  async function pickImages() {
    const picked = await window.dropResize.pickImages()
    if (picked.length === 0) {
      return
    }

    setFiles((existing) => dedupe([...existing, ...picked]))
  }

  async function pickOutputDir() {
    const selected = await window.dropResize.pickOutputDir()
    if (selected) {
      setOutputDir(selected)
    }
  }

  async function runResize() {
    if (!canRun) {
      return
    }

    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const request: ResizeRequest = {
        files,
        outputDir,
        outputNameTemplate,
        width,
        height,
        mode,
        format,
        jpegQuality,
      }
      const response = await window.dropResize.resizeImages(request)
      setResult(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Resize failed with unknown error'
      setError(message)
    } finally {
      setIsRunning(false)
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    const droppedPaths = Array.from(event.dataTransfer.files)
      .map((file) => (file as File & { path?: string }).path)
      .filter((value): value is string => Boolean(value))

    if (droppedPaths.length > 0) {
      setFiles((existing) => dedupe([...existing, ...droppedPaths]))
    }
  }

  function removeFile(target: string) {
    setFiles((existing) => existing.filter((item) => item !== target))
  }

  return (
    <main className="app-shell">
      <section
        className={`drop-zone${isDragging ? ' dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p>Drag image files here</p>
        <button type="button" onClick={pickImages}>Choose Images</button>
      </section>

      <button
        type="button"
        className="gear-button"
        aria-label="Open settings"
        onClick={() => setIsConfigOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.14 12.94a7.87 7.87 0 0 0 .06-.94 7.87 7.87 0 0 0-.06-.94l2.03-1.58a.48.48 0 0 0 .12-.62l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.14 7.14 0 0 0-1.63-.94l-.36-2.54A.48.48 0 0 0 13.93 2h-3.86a.48.48 0 0 0-.47.4l-.36 2.54a7.14 7.14 0 0 0-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.71 8.46a.48.48 0 0 0 .12.62l2.03 1.58a7.87 7.87 0 0 0-.06.94 7.87 7.87 0 0 0 .06.94l-2.03 1.58a.48.48 0 0 0-.12.62l1.92 3.32a.49.49 0 0 0 .59.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54a.48.48 0 0 0 .47.4h3.86a.48.48 0 0 0 .47-.4l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96a.49.49 0 0 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.62l-2.03-1.58ZM12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Z" />
        </svg>
      </button>

      <section className="files-panel">
        <div className="files-header">
          <p>Files ({files.length})</p>
          {files.length > 0 && (
            <button type="button" onClick={() => setFiles([])}>Clear</button>
          )}
        </div>
        <ul>
          {files.map((file) => (
            <li key={file}>
              <span>{file}</span>
              <button type="button" onClick={() => removeFile(file)}>Remove</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="actions">
        <button type="button" className="primary" disabled={!canRun} onClick={runResize}>
          {isRunning ? 'Resizing...' : 'Resize Images'}
        </button>
      </section>

      {summary && <p className="status success">{summary}</p>}
      {error && <p className="status error">{error}</p>}

      {result && (
        <section className="results-panel">
          <p>Last Run Details</p>
          <ul>
            {result.results.map((item) => (
              <li key={item.inputPath} className={item.success ? 'ok' : 'fail'}>
                <span>{item.inputPath}</span>
                <span>{item.success ? item.outputPath : item.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isConfigOpen && (
        <section className="config-overlay" role="dialog" aria-modal="true" aria-label="Settings">
          <div className="config-panel">
            <div className="config-header">
              <h2>Settings</h2>
              <button type="button" onClick={() => setIsConfigOpen(false)}>Close</button>
            </div>

            <section className="controls-grid">
              <label>
                Width
                <input
                  type="number"
                  min={1}
                  value={width}
                  onChange={(event) => setWidth(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  min={1}
                  value={height}
                  onChange={(event) => setHeight(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
              <label>
                Resize Mode
                <select value={mode} onChange={(event) => setMode(event.target.value as ResizeMode)}>
                  <option value="contain">Contain (keep aspect ratio)</option>
                  <option value="exact">Exact (force dimensions)</option>
                </select>
              </label>
              <label>
                Output Format
                <select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}>
                  <option value="keep">Keep source format</option>
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </label>
              <label>
                JPEG Quality ({jpegQuality})
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={jpegQuality}
                  onChange={(event) => setJpegQuality(Number(event.target.value))}
                />
              </label>
              <label className="template-field">
                Output Name Template
                <input
                  type="text"
                  value={outputNameTemplate}
                  onChange={(event) => setOutputNameTemplate(event.target.value)}
                  placeholder="{filename}-resized.{extension}"
                />
                <span className="template-help">
                  Placeholders: {'{filename}'}, {'{extension}'}, {'{width}'}, {'{height}'}
                </span>
              </label>
            </section>

            <section className="output-row">
              <div>
                <p className="label">Output Folder</p>
                <p className="path">{outputDir || 'Source file folder (default)'}</p>
              </div>
              <div className="output-actions">
                <button type="button" onClick={pickOutputDir}>Choose Folder</button>
                <button type="button" onClick={() => setOutputDir('')}>Use Source Folders</button>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  )
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items))
}

export default App
