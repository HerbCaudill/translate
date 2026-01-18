import { useEffect, useRef, useCallback } from "react"
import { IconRefresh } from "@tabler/icons-react"
import { useDrag } from "@use-gesture/react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cx } from "@/lib/utils"
import type { Language, LanguageTranslation } from "@/types"

export function TranslationResults({
  results,
  languages,
  sourceLanguage,
  selectedTab,
  onTabChange,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}: Props) {
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Focus tabs container when results first appear
  useEffect(() => {
    if (results.length > 0 && tabsContainerRef.current) {
      tabsContainerRef.current.focus()
    }
  }, [results.length > 0]) // Only trigger when we go from no results to having results

  // Get selectable languages for swipe navigation (exclude source language)
  const selectableLanguages = languages.filter(l => l.code !== sourceLanguage)

  // Get source language name for display
  const sourceLanguageName = languages.find(l => l.code === sourceLanguage)?.name

  // Navigate to next/previous tab (for swipe gestures)
  const navigateTab = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = selectableLanguages.findIndex(l => l.code === selectedTab)
      if (currentIndex === -1 && selectableLanguages.length > 0) {
        onTabChange(selectableLanguages[0].code)
        return
      }

      let newIndex: number
      if (direction === "next") {
        newIndex = (currentIndex + 1) % selectableLanguages.length
      } else {
        newIndex = (currentIndex - 1 + selectableLanguages.length) % selectableLanguages.length
      }

      onTabChange(selectableLanguages[newIndex].code)
    },
    [selectableLanguages, selectedTab, onTabChange],
  )

  // Swipe gesture handler
  const bind = useDrag(
    ({ swipe: [swipeX] }) => {
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
    <Tabs value={selectedTab} onValueChange={onTabChange} className="flex flex-1 flex-col">
      {/* Translated from banner and tabs - hidden while loading */}
      {!isLoading && sourceLanguageName && (
        <div className="-mx-4 -mt-4 mb-2 flex items-center justify-between bg-blue-50 px-4 py-1.5 sm:-mx-6 sm:-mt-6 sm:px-6">
          <p className="text-xs text-black">
            Translated from <span className="font-bold">{sourceLanguageName}</span>
          </p>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh translation"
              className="text-gray-500 hover:bg-blue-100 hover:text-gray-700"
            >
              <IconRefresh className={cx("mr-1 h-4 w-4", isRefreshing && "animate-spin")} />
              Retry
            </Button>
          )}
        </div>
      )}
      {!isLoading && (
        <div
          ref={tabsContainerRef}
          tabIndex={0}
          className="flex items-center justify-between gap-2 outline-none"
        >
          <TabsList className="flex-wrap">
            {languages.map(language => (
              <TabsTrigger
                key={language.code}
                value={language.code}
                disabled={language.code === sourceLanguage}
              >
                {language.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      )}
      <TabsContent value={selectedTab} className="flex flex-1 flex-col">
        <div ref={contentRef} {...bind()} className="flex-1 touch-pan-y">
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
      {[0, 1, 2].map(index => (
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
    <div className="flex flex-col gap-8 py-3">
      {meanings.map((meaning, meaningIndex) => (
        <div key={meaningIndex} className="flex flex-col gap-2">
          {hasMultipleMeanings && (
            <p className="text-sm font-bold text-gray-700">{meaning.sense}</p>
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
  selectedTab: string
  onTabChange: (value: string) => void
  isLoading?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}
