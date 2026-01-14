import { cn } from "@/lib/utils"

export function LanguageBadge({ name, className }: Props) {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground absolute -top-2.5 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {name}
    </span>
  )
}

type Props = {
  name: string
  className?: string
}
