import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TranslationCardSkeleton({ languageName }: Props) {
  return (
    <Card className="gap-3 py-3">
      <CardHeader className="px-4">
        <Skeleton className="h-5 w-20">{languageName}</Skeleton>
      </CardHeader>
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
