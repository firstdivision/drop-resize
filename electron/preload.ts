import { ipcRenderer, contextBridge } from 'electron'
import type { ResizeRequest, ResizeResponse } from '../src/shared/contracts'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('dropResize', {
  pickImages() {
    return ipcRenderer.invoke('files:pick-images') as Promise<string[]>
  },
  pickOutputDir() {
    return ipcRenderer.invoke('files:pick-output-dir') as Promise<string | null>
  },
  resizeImages(request: ResizeRequest) {
    return ipcRenderer.invoke('images:resize', request) as Promise<ResizeResponse>
  },
})
