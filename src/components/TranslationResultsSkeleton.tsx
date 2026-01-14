import { TranslationCardSkeleton } from "./TranslationCardSkeleton"
import type { Language } from "@/types"

export function TranslationResultsSkeleton({ languages }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {languages.map(language => (
        <TranslationCardSkeleton key={language.code} languageName={language.name} />
      ))}
    </div>
  )
}

type Props = {
  languages: Language[]
}
