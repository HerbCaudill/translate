import { useState, useEffect, useRef, useCallback } from "react"
import { IconRefresh } from "@tabler/icons-react"
import { useDrag } from "@use-gesture/react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage"
import { cx } from "@/lib/utils"
import type { Language, LanguageTranslation } from "@/types"

export function TranslationResults({
  results,
  languages,
  sourceLanguage,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}: Props) {
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Get selectable languages (non-source)
  const selectableLanguages = languages.filter(l => l.code !== sourceLanguage)

  // Get initial tab from storage, fallback to first non-source language
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    const stored = getItem<string>(STORAGE_KEYS.SELECTED_TAB)
    // Only use stored value if it's in the languages and not the source
    if (stored && languages.some(l => l.code === stored) && stored !== sourceLanguage) {
      return stored
    }
    // Find first non-source language
    const firstNonSource = languages.find(l => l.code !== sourceLanguage)
    return firstNonSource?.code ?? languages[0]?.code ?? ""
  })

  // When languages change, ensure selected tab is valid
  useEffect(() => {
    if (languages.length === 0) return

    const isSelectedTabValid = languages.some(l => l.code === selectedTab)
    const isSourceSelected = selectedTab === sourceLanguage
    if (!isSelectedTabValid || isSourceSelected) {
      // Try to restore from storage first
      const stored = getItem<string>(STORAGE_KEYS.SELECTED_TAB)
      if (stored && languages.some(l => l.code === stored) && stored !== sourceLanguage) {
        setSelectedTab(stored)
      } else {
        // Fallback to first non-source language
        const firstNonSource = languages.find(l => l.code !== sourceLanguage)
        setSelectedTab(firstNonSource?.code ?? languages[0]?.code)
      }
    }
  }, [languages, selectedTab, sourceLanguage])

  // Navigate to next/previous tab
  const navigateTab = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = selectableLanguages.findIndex(l => l.code === selectedTab)
      if (currentIndex === -1) return

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys when focus is in the tabs area or content area
      const activeElement = document.activeElement
      const isInTabsArea =
        tabsContainerRef.current?.contains(activeElement) ||
        contentRef.current?.contains(activeElement)

      if (!isInTabsArea) return

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        navigateTab("next")
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        navigateTab("prev")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigateTab])

  // Focus tabs container when results first appear
  useEffect(() => {
    if (results.length > 0 && tabsContainerRef.current) {
      tabsContainerRef.current.focus()
    }
  }, [results.length > 0]) // Only trigger when we go from no results to having results

  // Save selected tab to storage when it changes
  const handleTabChange = (value: string) => {
    // Don't allow selecting the source language
    if (value === sourceLanguage) return
    setSelectedTab(value)
    setItem(STORAGE_KEYS.SELECTED_TAB, value)
  }

  // Swipe gesture handler
  const bind = useDrag(
    ({ swipe: [swipeX], direction: [dx] }) => {
      if (swipeX !== 0) {
        // Swipe left = next, swipe right = prev
        navigateTab(swipeX > 0 ? "prev" : "next")
      }
    },
    {
      axis: "x",
      swipe: { distance: 50, velocity: 0.3 },
    },
  )

  if (languages.length === 0) {
    return null
  }

  // Find the result for the selected tab
  const selectedResult = results.find(r => r.language.code === selectedTab)

  return (
    <Tabs value={selectedTab} onValueChange={handleTabChange}>
      <div
        ref={tabsContainerRef}
        tabIndex={0}
        className="flex items-center justify-between gap-2 outline-none"
      >
        <TabsList className="flex-wrap">
          {languages.map(language => {
            const isSource = language.code === sourceLanguage
            return (
              <TabsTrigger
                key={language.code}
                value={language.code}
                disabled={isSource}
                className={cx(isSource && "cursor-not-allowed opacity-40")}
              >
                {language.name}
              </TabsTrigger>
            )
          })}
        </TabsList>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh translation"
            className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
          >
            <IconRefresh className={cx("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        )}
      </div>
      <TabsContent value={selectedTab}>
        <div ref={contentRef} {...bind()} className="touch-pan-y">
          {isLoading ?
            <TranslationSkeleton />
          : selectedResult ?
            <TranslationContent translation={selectedResult} />
          : null}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function TranslationSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-3">
      {[0, 1].map(index => (
        <div key={index} className="flex flex-col gap-0.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

function TranslationContent({ translation }: { translation: LanguageTranslation }) {
  const { meanings } = translation
  const hasMultipleMeanings = meanings.length > 1

  return (
    <div className="flex flex-col gap-4 py-3">
      {meanings.map((meaning, meaningIndex) => (
        <div key={meaningIndex} className="flex flex-col gap-2">
          {hasMultipleMeanings && (
            <p className="text-muted-foreground text-xs font-medium italic">{meaning.sense}</p>
          )}
          <div className="flex flex-col gap-3">
            {meaning.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex flex-col gap-0.5">
                <p className="font-mono text-base">{option.text}</p>
                <p className="text-muted-foreground text-xs">{option.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type Props = {
  results: LanguageTranslation[]
  languages: Language[]
  sourceLanguage?: string
  isLoading?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}
