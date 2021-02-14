import { supportedLanguages } from './constant'

export interface Config {
  token: string
  targetLang: SupportLanguageKeys
  region: APIRegions
  ocrSecretId?: string
  ocrSecretKey?: string
  hoverButton?: boolean
}

export type SupportLanguageKeys = keyof typeof supportedLanguages

export type APIRegions = 'default'

export type TranslateResult = {
  translations: Array<{
    detected_source_language: SupportLanguageKeys
    text: string
  }>
}
