/// <reference types="vite-plugin-electron/electron-env" />
import type { ResizeRequest, ResizeResponse } from '../src/shared/contracts'

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  dropResize: {
    pickImages: () => Promise<string[]>
    pickOutputDir: () => Promise<string | null>
    resizeImages: (request: ResizeRequest) => Promise<ResizeResponse>
  }
}
