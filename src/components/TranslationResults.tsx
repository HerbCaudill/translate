import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage"
import type { LanguageTranslation } from "@/types"

export function TranslationResults({ results }: Props) {
  // Get initial tab from storage, fallback to first available result
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    const stored = getItem<string>(STORAGE_KEYS.SELECTED_TAB)
    // Only use stored value if it's in the results
    if (stored && results.some(r => r.language.code === stored)) {
      return stored
    }
    return results[0]?.language.code ?? ""
  })

  // When results change, ensure selected tab is valid
  useEffect(() => {
    if (results.length === 0) return

    const isSelectedTabValid = results.some(r => r.language.code === selectedTab)
    if (!isSelectedTabValid) {
      // Try to restore from storage first
      const stored = getItem<string>(STORAGE_KEYS.SELECTED_TAB)
      if (stored && results.some(r => r.language.code === stored)) {
        setSelectedTab(stored)
      } else {
        // Fallback to first result
        setSelectedTab(results[0].language.code)
      }
    }
  }, [results, selectedTab])

  // Save selected tab to storage when it changes
  const handleTabChange = (value: string) => {
    setSelectedTab(value)
    setItem(STORAGE_KEYS.SELECTED_TAB, value)
  }

  if (results.length === 0) {
    return null
  }

  return (
    <Tabs value={selectedTab} onValueChange={handleTabChange}>
      <TabsList className="flex-wrap">
        {results.map(result => (
          <TabsTrigger key={result.language.code} value={result.language.code}>
            {result.language.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {results.map(result => (
        <TabsContent key={result.language.code} value={result.language.code}>
          <TranslationContent translation={result} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function TranslationContent({ translation }: { translation: LanguageTranslation }) {
  const { options } = translation

  return (
    <Card className="gap-3 py-3">
      <CardContent className="flex flex-col gap-3 px-4">
        {options.map((option, index) => (
          <div key={index} className="flex flex-col gap-0.5">
            <p className="font-mono text-base">{option.text}</p>
            <p className="text-muted-foreground text-xs">{option.explanation}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type Props = {
  results: LanguageTranslation[]
}
