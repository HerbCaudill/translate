import { Card, CardContent } from "@/components/ui/card"
import { LanguageBadge } from "./LanguageBadge"
import type { LanguageTranslation } from "@/types"

export function TranslationCard({ translation }: Props) {
  const { language, options } = translation

  return (
    <Card data-language={language.code} className="relative gap-3 pt-5 pb-3">
      <LanguageBadge name={language.name} />
      <CardContent className="flex flex-col gap-3 px-4">
        {options.map((option, index) => (
          <div key={index} className="flex flex-col gap-0.5">
            <p className="text-base">{option.text}</p>
            <p className="text-muted-foreground text-xs">{option.explanation}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type Props = {
  translation: LanguageTranslation
}
