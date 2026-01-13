import { IconLanguage } from "@tabler/icons-react"

export function EmptyState() {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 py-16 text-center">
      <IconLanguage size={48} stroke={1.5} className="opacity-50" />
      <div className="space-y-1">
        <p className="text-lg font-medium">Start typing to translate</p>
        <p className="text-sm">
          Enter text above and it will be translated automatically when you finish typing
        </p>
      </div>
    </div>
  )
}
