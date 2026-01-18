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
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage"
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
    source,
    alternateSources,
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

  const handleRefresh = useCallback(() => {
    const text = inputText.trim()
    if (text) {
      // Force a fresh translation, bypassing cache
      translatedTextRef.current = text
      savedTranslationRef.current = "" // Reset so new results get saved
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
    const isComplete = translationStatus === "success"
    const inputToSave = translatedTextRef.current

    if (hasResults && isComplete && inputToSave && inputToSave !== savedTranslationRef.current) {
      savedTranslationRef.current = inputToSave
      addEntry({
        input: inputToSave,
        results,
        source: source ?? "Unknown",
        alternateSources,
        timestamp: Date.now(),
      })
    }
  }, [translationStatus, results, source, alternateSources, addEntry])

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

  // Show history results if selected, otherwise show translation results
  const displayResults = selectedHistoryEntry?.translation.results ?? results

  // Show alternate sources from history entry or live translation state
  const displayAlternateSources =
    selectedHistoryEntry?.translation.alternateSources ?? alternateSources

  // Handle alternate source language selection - re-translate with the selected language as a hint
  const handleAlternateSourceSelect = useCallback(
    (languageCode: string) => {
      const text = inputText.trim()
      if (text) {
        // Clear the selected history entry since we're doing a fresh translation
        setSelectedHistoryEntry(null)
        // Reset saved ref so the new translation gets saved to history
        savedTranslationRef.current = ""
        // Translate with the selected language as a hint
        translate(text, languageCode)
      }
    },
    [inputText, translate],
  )

  // Determine if user is typing (input differs from what's displayed)
  // This is true when user has typed something but hasn't submitted yet
  const isTyping = useMemo(() => {
    const trimmedInput = inputText.trim()
    if (!trimmedInput) return false
    if (translationStatus === "translating") return false

    // Check if input matches the source of displayed results
    if (selectedHistoryEntry) {
      return trimmedInput !== selectedHistoryEntry.input
    }

    // If no history entry selected, compare to what was last translated
    return trimmedInput !== translatedTextRef.current
  }, [inputText, translationStatus, selectedHistoryEntry])

  // Detect source language by finding which configured language is missing from results
  const sourceLanguage = useMemo(() => {
    if (displayResults.length === 0) return undefined
    const resultLanguageCodes = new Set(displayResults.map(r => r.language.code))
    const missingLanguage = settings.languages.find(l => !resultLanguageCodes.has(l.code))
    return missingLanguage?.code
  }, [displayResults, settings.languages])

  // Selected tab state (lifted from TranslationResults for global keyboard control)
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    const stored = getItem<string>(STORAGE_KEYS.SELECTED_TAB)
    if (stored && settings.languages.some(l => l.code === stored) && stored !== sourceLanguage) {
      return stored
    }
    const firstNonSource = settings.languages.find(l => l.code !== sourceLanguage)
    return firstNonSource?.code ?? settings.languages[0]?.code ?? ""
  })

  // Get selectable languages (non-source)
  const selectableLanguages = useMemo(
    () => settings.languages.filter(l => l.code !== sourceLanguage),
    [settings.languages, sourceLanguage],
  )

  // Navigate to next/previous tab
  const navigateTab = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = selectableLanguages.findIndex(l => l.code === selectedTab)
      if (currentIndex === -1 && selectableLanguages.length > 0) {
        // If current tab not found, select first selectable language
        const newTab = selectableLanguages[0].code
        setSelectedTab(newTab)
        setItem(STORAGE_KEYS.SELECTED_TAB, newTab)
        return
      }

      let newIndex: number
      if (direction === "next") {
        newIndex = (currentIndex + 1) % selectableLanguages.length
      } else {
        newIndex = (currentIndex - 1 + selectableLanguages.length) % selectableLanguages.length
      }

      const newTab = selectableLanguages[newIndex].code
      setSelectedTab(newTab)
      setItem(STORAGE_KEYS.SELECTED_TAB, newTab)
    },
    [selectableLanguages, selectedTab],
  )

  // Handle tab change from TranslationResults
  const handleTabChange = useCallback(
    (value: string) => {
      if (value === sourceLanguage) return
      setSelectedTab(value)
      setItem(STORAGE_KEYS.SELECTED_TAB, value)
    },
    [sourceLanguage],
  )

  // Global keyboard handler for left/right arrows to switch languages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focused on an input element
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (isInputFocused) return

      if (e.key === "ArrowRight") {
        e.preventDefault()
        navigateTab("next")
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        navigateTab("prev")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigateTab])

  // Update selected tab when languages change
  useEffect(() => {
    if (settings.languages.length === 0) return

    const isSelectedTabValid = settings.languages.some(l => l.code === selectedTab)
    const isSourceSelected = selectedTab === sourceLanguage
    if (!isSelectedTabValid || isSourceSelected) {
      const stored = getItem<string>(STORAGE_KEYS.SELECTED_TAB)
      if (stored && settings.languages.some(l => l.code === stored) && stored !== sourceLanguage) {
        setSelectedTab(stored)
      } else {
        const firstNonSource = settings.languages.find(l => l.code !== sourceLanguage)
        if (firstNonSource) {
          setSelectedTab(firstNonSource.code)
        }
      }
    }
  }, [settings.languages, selectedTab, sourceLanguage])

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Blue header area - fixed, non-scrollable */}
      <div className="shrink-0 bg-blue-600 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="" className="h-12 w-12 rounded-lg" />
              <h1 className="text-lg font-semibold text-white">Universal Translator</h1>
            </div>
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

      {/* Content area - scrollable container for results */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {(inputText.trim() || displayResults.length > 0) && (
          <TranslationResults
            results={displayResults}
            languages={settings.languages}
            sourceLanguage={sourceLanguage}
            alternateSources={displayAlternateSources}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            isLoading={translationStatus === "translating"}
            isTyping={isTyping}
            onRefresh={handleRefresh}
            isRefreshing={translationStatus === "translating"}
            onAlternateSourceSelect={handleAlternateSourceSelect}
          />
        )}
      </div>
    </div>
  )
}

export default App
