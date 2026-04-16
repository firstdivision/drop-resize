export type ResizeMode = 'contain' | 'exact'
export type OutputFormat = 'keep' | 'png' | 'jpeg'

export interface ResizeRequest {
  files: string[]
  outputDir?: string
  outputNameTemplate: string
  width: number
  height: number
  mode: ResizeMode
  format: OutputFormat
  jpegQuality: number
}

export interface ResizeItemResult {
  inputPath: string
  outputPath?: string
  success: boolean
  message?: string
}

export interface ResizeResponse {
  successCount: number
  failureCount: number
  results: ResizeItemResult[]
}
