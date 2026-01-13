import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TranslationCardSkeleton({ languageName }: Props) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24">{languageName}</Skeleton>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Two translation options */}
        {[0, 1].map(index => (
          <div key={index} className="flex flex-col gap-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type Props = {
  languageName?: string
}
