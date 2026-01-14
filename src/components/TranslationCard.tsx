import { Card, CardContent } from "@/components/ui/card"
import type { LanguageTranslation } from "@/types"

export function TranslationCard({ translation }: Props) {
  const { language, options } = translation

  return (
    <Card data-language={language.code} className="relative gap-3 pt-5 pb-3">
      <span className="bg-primary text-primary-foreground absolute -top-2.5 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium">
        {language.name}
      </span>
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
