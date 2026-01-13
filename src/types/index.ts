/** A language the user wants to translate to */
export type Language = {
  code: string
  name: string
}

/** User settings stored in localStorage */
export type Settings = {
  apiKey: string
  languages: Language[]
  translationPrompt: string
  completionPrompt: string
}

/** A single translation option with explanation */
export type TranslationOption = {
  text: string
  explanation: string
}

/** Translation result for a single target language */
export type LanguageTranslation = {
  language: Language
  options: TranslationOption[]
}

/** Complete translation result for all target languages */
export type Translation = {
  input: string
  results: LanguageTranslation[]
  timestamp: number
}

/** A saved translation in history */
export type HistoryEntry = {
  id: string
  input: string
  translation: Translation
  createdAt: number
}
