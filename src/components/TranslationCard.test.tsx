import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TranslationCard } from "./TranslationCard"
import type { LanguageTranslation } from "@/types"

describe("TranslationCard", () => {
  const mockTranslation: LanguageTranslation = {
    language: { code: "es", name: "Spanish" },
    options: [
      { text: "Hola", explanation: "Common greeting" },
      { text: "Buenos días", explanation: "Formal morning greeting" },
    ],
  }

  it("renders language name as title", () => {
    render(<TranslationCard translation={mockTranslation} />)
    expect(screen.getByText("Spanish")).toBeInTheDocument()
  })

  it("renders all translation options", () => {
    render(<TranslationCard translation={mockTranslation} />)
    expect(screen.getByText("Hola")).toBeInTheDocument()
    expect(screen.getByText("Buenos días")).toBeInTheDocument()
  })

  it("renders explanations for each option", () => {
    render(<TranslationCard translation={mockTranslation} />)
    expect(screen.getByText("Common greeting")).toBeInTheDocument()
    expect(screen.getByText("Formal morning greeting")).toBeInTheDocument()
  })

  it("sets data-language attribute with language code", () => {
    render(<TranslationCard translation={mockTranslation} />)
    const card = screen.getByText("Spanish").closest("[data-language]")
    expect(card).toHaveAttribute("data-language", "es")
  })

  it("handles single option", () => {
    const singleOption: LanguageTranslation = {
      language: { code: "fr", name: "French" },
      options: [{ text: "Bonjour", explanation: "Hello" }],
    }
    render(<TranslationCard translation={singleOption} />)
    expect(screen.getByText("French")).toBeInTheDocument()
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("handles empty options array", () => {
    const emptyOptions: LanguageTranslation = {
      language: { code: "de", name: "German" },
      options: [],
    }
    render(<TranslationCard translation={emptyOptions} />)
    expect(screen.getByText("German")).toBeInTheDocument()
  })

  it("applies serif font to translation text", () => {
    render(<TranslationCard translation={mockTranslation} />)
    const translationText = screen.getByText("Hola")
    expect(translationText).toHaveClass("font-serif")
  })
})
