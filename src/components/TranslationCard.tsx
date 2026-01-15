import { Card, CardContent } from "@/components/ui/card"
import { LanguageBadge } from "./LanguageBadge"
import type { LanguageTranslation } from "@/types"

export function TranslationCard({ translation }: Props) {
  const { language, meanings } = translation
  const hasMultipleMeanings = meanings.length > 1

  return (
    <Card data-language={language.code} className="relative gap-3 pt-5 pb-3">
      <LanguageBadge name={language.name} />
      <CardContent className="flex flex-col gap-4 px-4">
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
      </CardContent>
    </Card>
  )
}

type Props = {
  translation: LanguageTranslation
}
