/** A language the user wants to translate to */
export type Language = {
  code: string
  name: string
}

/** User settings stored in localStorage */
export type Settings = {
  apiKey: string
  languages: Language[]
}

/** A single translation option with explanation */
export type TranslationOption = {
  text: string
  explanation: string
}

/** A meaning/sense of the source text with its translation options */
export type Meaning = {
  sense: string
  options: TranslationOption[]
}

/** Translation result for a single target language */
export type LanguageTranslation = {
  language: Language
  meanings: Meaning[]
}

/** Complete translation result for all target languages */
export type Translation = {
  input: string
  results: LanguageTranslation[]
  timestamp: number
  /** The detected source language of the input */
  source: string
  /** Alternative possible source languages that could be selected */
  alternateSources?: string[]
}

/** A saved translation in history */
export type HistoryEntry = {
  id: string
  input: string
  translation: Translation
  createdAt: number
}

export type TranslationResult =
  | {
      success: true
      translations: LanguageTranslation[]
      /** The detected source language of the input */
      source: string
      /** Alternative possible source languages that could be selected */
      alternateSources?: string[]
    }
  | { success: false; error: string }

export type ApiTranslationEntry = {
  languageCode: string
  meanings: Meaning[]
}

export type ApiResponse = {
  input: string
  source: string
  alternateSources?: string[]
  translations: ApiTranslationEntry[]
}
