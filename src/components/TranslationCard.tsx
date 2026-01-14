import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LanguageTranslation } from "@/types"

export function TranslationCard({ translation }: Props) {
  const { language, options } = translation

  return (
    <Card data-language={language.code} className="gap-3 py-3">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">{language.name}</CardTitle>
      </CardHeader>
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
