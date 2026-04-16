/// <reference types="vite/client" />
import type { ResizeRequest, ResizeResponse } from './shared/contracts'

declare global {
	interface Window {
		dropResize: {
			pickImages: () => Promise<string[]>
			pickOutputDir: () => Promise<string | null>
			resizeImages: (request: ResizeRequest) => Promise<ResizeResponse>
		}
	}
}

export {}
