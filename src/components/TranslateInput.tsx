import { useEffect, useRef } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export const TranslateInput = ({
  value,
  onChange,
  onEscape,
  placeholder = "Enter text to translate...",
  disabled = false,
  loading = false,
}: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      onEscape?.()
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("min-h-32 resize-none text-lg", loading && "pr-10")}
      />
      {loading && (
        <div className="absolute top-3 right-3">
          <IconLoader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      )}
    </div>
  )
}

type Props = {
  value: string
  onChange: (value: string) => void
  onEscape?: () => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}
