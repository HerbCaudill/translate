import { useState, useEffect, useRef } from "react"
import { useSettings } from "@/hooks/useSettings"
import { useDebounce } from "@/hooks/useDebounce"
import { useCompletionCheck } from "@/hooks/useCompletionCheck"
import { useTranslation } from "@/hooks/useTranslation"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"
import { TranslateInput } from "@/components/TranslateInput"
import { TranslationResults } from "@/components/TranslationResults"
import { TranslationResultsSkeleton } from "@/components/TranslationResultsSkeleton"
import { SettingsDialog } from "@/components/SettingsDialog"

export function App() {
  const { settings, updateSettings } = useSettings()
  const [inputText, setInputText] = useState("")

  const debouncedText = useDebounce(inputText, 500)

  const { status: completionStatus } = useCompletionCheck({
    text: debouncedText,
    apiKey: settings.apiKey,
    customPrompt: settings.completionPrompt,
  })

  const {
    status: translationStatus,
    results,
    translate,
    reset: resetTranslation,
  } = useTranslation({
    apiKey: settings.apiKey,
    languages: settings.languages,
    customPrompt: settings.translationPrompt,
  })

  // Track which text we've already translated to avoid re-translating
  const translatedTextRef = useRef<string>("")

  // Trigger translation when completion check returns "complete"
  useEffect(() => {
    if (
      completionStatus === "complete" &&
      debouncedText.trim() &&
      debouncedText !== translatedTextRef.current
    ) {
      translatedTextRef.current = debouncedText
      translate(debouncedText)
    }
  }, [completionStatus, debouncedText, translate])

  // Fallback: translate after 2s if auto-detection hasn't triggered
  useEffect(() => {
    // Skip if no text, already translated this text, or completion check succeeded
    if (
      !debouncedText.trim() ||
      debouncedText === translatedTextRef.current ||
      completionStatus === "complete"
    ) {
      return
    }

    const fallbackTimer = setTimeout(() => {
      // Double-check we still haven't translated this text
      if (debouncedText.trim() && debouncedText !== translatedTextRef.current) {
        translatedTextRef.current = debouncedText
        translate(debouncedText)
      }
    }, 2000)

    return () => clearTimeout(fallbackTimer)
  }, [debouncedText, completionStatus, translate])

  // Reset translation when input is cleared
  useEffect(() => {
    if (!inputText.trim()) {
      translatedTextRef.current = ""
      resetTranslation()
    }
  }, [inputText, resetTranslation])

  const handleApiKeySubmit = async (apiKey: string) => {
    updateSettings({ apiKey })
  }

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Translate</h1>
        <SettingsDialog
          languages={settings.languages}
          onLanguagesChange={languages => updateSettings({ languages })}
          translationPrompt={settings.translationPrompt}
          onTranslationPromptChange={translationPrompt => updateSettings({ translationPrompt })}
        />
      </header>
      <TranslateInput value={inputText} onChange={setInputText} />

      {/* Show skeleton while translating, results when done */}
      {translationStatus === "translating" ?
        <TranslationResultsSkeleton languages={settings.languages} />
      : <TranslationResults results={results} />}
    </div>
  )
}

export default App
