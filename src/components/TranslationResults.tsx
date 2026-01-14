import { TranslationCard } from "./TranslationCard"
import type { LanguageTranslation } from "@/types"

export function TranslationResults({ results }: Props) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {results.map(result => (
        <TranslationCard key={result.language.code} translation={result} />
      ))}
    </div>
  )
}

type Props = {
  results: LanguageTranslation[]
}
