import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LanguageTranslation } from "@/types"

export function TranslationCard({ translation }: Props) {
  const { language, options } = translation

  return (
    <Card data-language={language.code}>
      <CardHeader>
        <CardTitle>{language.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {options.map((option, index) => (
          <div key={index} className="flex flex-col gap-1">
            <p className="text-lg">{option.text}</p>
            <p className="text-muted-foreground text-sm">{option.explanation}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type Props = {
  translation: LanguageTranslation
}
