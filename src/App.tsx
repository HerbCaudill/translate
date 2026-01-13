import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useSettings } from "@/hooks/useSettings"
import { useDebounce } from "@/hooks/useDebounce"
import { useCompletionCheck } from "@/hooks/useCompletionCheck"
import { useTranslation } from "@/hooks/useTranslation"
import { useHistory } from "@/hooks/useHistory"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"
import { TranslateInput } from "@/components/TranslateInput"
import { TranslationResults } from "@/components/TranslationResults"
import { TranslationResultsSkeleton } from "@/components/TranslationResultsSkeleton"
import { SettingsDialog } from "@/components/SettingsDialog"
import { HistoryDialog } from "@/components/HistoryDialog"
import { EmptyState } from "@/components/EmptyState"
import { HistoryEntry } from "@/types"

export function App() {
  const { settings, updateSettings } = useSettings()
  const { history, addEntry, clearHistory } = useHistory()
  const [inputText, setInputText] = useState("")
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null)

  const debouncedText = useDebounce(inputText, 500)

  const { status: completionStatus } = useCompletionCheck({
    text: debouncedText,
    apiKey: settings.apiKey,
    customPrompt: settings.completionPrompt,
  })

  const {
    status: translationStatus,
    results,
    error: translationError,
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
      setSelectedHistoryEntry(null)
    }
  }, [inputText, resetTranslation])

  // Clear selected history entry when user types something different
  useEffect(() => {
    if (selectedHistoryEntry && inputText !== selectedHistoryEntry.input) {
      setSelectedHistoryEntry(null)
    }
  }, [inputText, selectedHistoryEntry])

  // Track which translation we've saved to avoid duplicates
  const savedTranslationRef = useRef<string>("")

  // Save translation to history when it completes
  useEffect(() => {
    const hasResults = results.length > 0
    const isComplete = translationStatus === "success" || translationStatus === "partial"
    const inputToSave = translatedTextRef.current

    if (hasResults && isComplete && inputToSave && inputToSave !== savedTranslationRef.current) {
      savedTranslationRef.current = inputToSave
      addEntry({
        input: inputToSave,
        results,
        timestamp: Date.now(),
      })
    }
  }, [translationStatus, results, addEntry])

  // Show toast on translation error
  useEffect(() => {
    if (translationError) {
      toast.error("Translation failed", {
        description: translationError,
        action: {
          label: "Retry",
          onClick: () => {
            if (translatedTextRef.current) {
              translate(translatedTextRef.current)
            }
          },
        },
      })
    }
  }, [translationError, translate])

  const handleApiKeySubmit = async (apiKey: string) => {
    updateSettings({ apiKey })
  }

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    // Set the input text to show what was translated
    setInputText(entry.input)
    // Store the selected entry to display its results
    setSelectedHistoryEntry(entry)
    // Mark as already translated so we don't re-translate
    translatedTextRef.current = entry.input
    // Mark as saved so we don't save it again
    savedTranslationRef.current = entry.input
  }

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  // Show history results if selected, otherwise show translation results
  const displayResults = selectedHistoryEntry?.translation.results ?? results

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Translate</h1>
        <div className="flex items-center gap-1">
          <HistoryDialog
            history={history}
            onSelectEntry={handleSelectHistoryEntry}
            onClearHistory={clearHistory}
          />
          <SettingsDialog
            languages={settings.languages}
            onLanguagesChange={languages => updateSettings({ languages })}
            translationPrompt={settings.translationPrompt}
            onTranslationPromptChange={translationPrompt => updateSettings({ translationPrompt })}
          />
        </div>
      </header>
      <TranslateInput
        value={inputText}
        onChange={setInputText}
        onEscape={() => setInputText("")}
        loading={completionStatus === "checking" || translationStatus === "translating"}
      />

      {/* Show skeleton while translating, results when done, or empty state */}
      {translationStatus === "translating" ?
        <TranslationResultsSkeleton languages={settings.languages} />
      : displayResults.length > 0 ?
        <TranslationResults results={displayResults} />
      : <EmptyState />}
    </div>
  )
}

export default App
