import { useEffect, useRef } from "react"
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const TranslateInput = ({
  value,
  onChange,
  onSubmit,
  onEscape,
  placeholder = "Enter text to translate...",
  disabled = false,
  loading = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault()
      onSubmit()
    } else if (e.key === "Escape") {
      onEscape?.()
    }
  }

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit()
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="border-white/20 bg-white font-mono text-lg focus-visible:ring-0 focus-visible:border-white/20"
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !value.trim() || loading}
        size="icon"
        className={cn(
          "shrink-0 bg-white text-blue-600 hover:bg-blue-50",
          loading && "pointer-events-none",
        )}
      >
        {loading ?
          <IconLoader2 className="h-5 w-5 animate-spin" />
        : <IconArrowRight className="h-5 w-5" />}
      </Button>
    </div>
  )
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onEscape?: () => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}
