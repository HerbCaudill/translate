import { useState } from "react"
import { IconCheck, IconSelector } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LANGUAGES } from "@/lib/languages"
import { Language } from "@/types"
import { cn } from "@/lib/utils"

export const LanguageCombobox = ({ value, onChange, excludeCodes = [], placeholder = "Select language..." }: Props) => {
  const [open, setOpen] = useState(false)

  const availableLanguages = LANGUAGES.filter(lang => !excludeCodes.includes(lang.code))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select language"
          className="w-full justify-between"
        >
          {value ? (
            <span className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                {value.code}
              </span>
              <span>{value.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search languages..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {availableLanguages.map(language => (
                <CommandItem
                  key={language.code}
                  value={`${language.code} ${language.name}`}
                  onSelect={() => {
                    onChange(language)
                    setOpen(false)
                  }}
                >
                  <IconCheck
                    className={cn("mr-2 h-4 w-4", value?.code === language.code ? "opacity-100" : "opacity-0")}
                  />
                  <span className="bg-muted text-muted-foreground mr-2 rounded px-1.5 py-0.5 text-xs font-medium">
                    {language.code}
                  </span>
                  {language.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type Props = {
  value: Language | null
  onChange: (language: Language) => void
  excludeCodes?: string[]
  placeholder?: string
}
