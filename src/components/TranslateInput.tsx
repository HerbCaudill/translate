import { useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

export const TranslateInput = ({
  value,
  onChange,
  onEscape,
  placeholder = "Enter text to translate...",
  disabled = false,
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
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="min-h-32 resize-none text-lg"
    />
  )
}

type Props = {
  value: string
  onChange: (value: string) => void
  onEscape?: () => void
  placeholder?: string
  disabled?: boolean
}
