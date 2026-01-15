import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  const { history, addEntry, removeEntry, findByInput, searchHistory } = useHistory()
  const { canInstall, promptInstall } = useInstallPrompt()

  // Initialize from most recent history entry if available
  const mostRecentEntry = history[0] ?? null
  const [inputText, setInputText] = useState(() => mostRecentEntry?.input ?? "")
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(
    () => mostRecentEntry,
  )

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
  const translatedTextRef = useRef<string>(mostRecentEntry?.input ?? "")

  // Track which translation we've saved to avoid duplicates
  const savedTranslationRef = useRef<string>(mostRecentEntry?.input ?? "")

  const handleSubmit = useCallback(() => {
    const text = inputText.trim()
    if (text && text !== translatedTextRef.current) {
      translatedTextRef.current = text

      // Check if we have this translation cached in history
      const cachedEntry = findByInput(text)
      if (cachedEntry) {
        // Use cached result instead of calling the API
        setSelectedHistoryEntry(cachedEntry)
        savedTranslationRef.current = text
      } else {
        // No cached result, call the API
        setSelectedHistoryEntry(null)
        translate(text)
      }
    }
  }, [inputText, translate, findByInput])

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

  // Compute suggestions from history based on current input
  const historySuggestions = useMemo(() => {
    return searchHistory(inputText)
  }, [inputText, searchHistory])

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  // Show history results if selected, otherwise show translation results
  const displayResults = selectedHistoryEntry?.translation.results ?? results

  return (
    <div className="flex min-h-screen flex-col">
      {/* Blue header area */}
      <div className="bg-blue-600">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Translate</h1>
            <div className="flex items-center gap-1">
              <InstallPrompt
                canInstall={canInstall}
                onInstall={promptInstall}
                className="text-white hover:bg-white/20"
              />
              <HistoryDialog
                history={history}
                onSelectEntry={handleSelectHistoryEntry}
                onRemoveEntry={removeEntry}
                className="text-white hover:bg-white/20"
              />
              <SettingsDialog
                languages={settings.languages}
                onLanguagesChange={languages => updateSettings({ languages })}
                className="text-white hover:bg-white/20"
              />
            </div>
          </header>
          <TranslateInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSubmit}
            onEscape={() => setInputText("")}
            onSelectSuggestion={handleSelectHistoryEntry}
            suggestions={historySuggestions}
            loading={translationStatus === "translating"}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-6">
        {displayResults.length > 0 && <TranslationResults results={displayResults} />}
      </div>
    </div>
  )
}

export default App
