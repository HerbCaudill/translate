import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useSettings } from "@/hooks/useSettings"
import { useTranslation } from "@/hooks/useTranslation"
import { useHistory } from "@/hooks/useHistory"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"
import { TranslateInput } from "@/components/TranslateInput"
import { TranslationResults } from "@/components/TranslationResults"
import { SettingsDialog } from "@/components/SettingsDialog"
import { HistoryDialog } from "@/components/HistoryDialog"
import { InstallPrompt } from "@/components/InstallPrompt"
import { HistoryEntry } from "@/types"

export function App() {
  const { settings, updateSettings } = useSettings()
  const { history, addEntry, clearHistory } = useHistory()
  const { canInstall, promptInstall } = useInstallPrompt()
  const [inputText, setInputText] = useState("")
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null)

  const {
    status: translationStatus,
    results,
    error: translationError,
    translate,
    reset: resetTranslation,
  } = useTranslation({
    apiKey: settings.apiKey,
    languages: settings.languages,
  })

  // Track which text we've already translated to avoid re-translating
  const translatedTextRef = useRef<string>("")

  // Track which translation we've saved to avoid duplicates
  const savedTranslationRef = useRef<string>("")

  const handleSubmit = useCallback(() => {
    const text = inputText.trim()
    if (text && text !== translatedTextRef.current) {
      translatedTextRef.current = text
      setSelectedHistoryEntry(null)
      translate(text)
    }
  }, [inputText, translate])

  // Reset translation when input is cleared
  useEffect(() => {
    if (!inputText.trim()) {
      translatedTextRef.current = ""
      savedTranslationRef.current = ""
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Translate</h1>
        <div className="flex items-center gap-1">
          <InstallPrompt canInstall={canInstall} onInstall={promptInstall} />
          <HistoryDialog
            history={history}
            onSelectEntry={handleSelectHistoryEntry}
            onClearHistory={clearHistory}
          />
          <SettingsDialog
            languages={settings.languages}
            onLanguagesChange={languages => updateSettings({ languages })}
          />
        </div>
      </header>
      <TranslateInput
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        onEscape={() => setInputText("")}
        loading={translationStatus === "translating"}
      />

      {displayResults.length > 0 && <TranslationResults results={displayResults} />}
    </div>
  )
}

export default App
