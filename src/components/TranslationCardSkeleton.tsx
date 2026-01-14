import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TranslationCardSkeleton({ languageName }: Props) {
  return (
    <Card className="relative gap-3 pt-5 pb-3">
      <Skeleton className="absolute -top-2.5 left-3 h-5 w-20 rounded-full">
        {languageName}
      </Skeleton>
      <CardContent className="flex flex-col gap-3 px-4">
        {/* Two translation options */}
        {[0, 1].map(index => (
          <div key={index} className="flex flex-col gap-0.5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type Props = {
  languageName?: string
}
