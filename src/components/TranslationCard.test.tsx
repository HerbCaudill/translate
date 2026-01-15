import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TranslationCard } from "./TranslationCard"
import type { LanguageTranslation } from "@/types"

describe("TranslationCard", () => {
  const mockTranslation: LanguageTranslation = {
    language: { code: "es", name: "Spanish" },
    meanings: [
      {
        sense: "greeting",
        options: [
          { text: "Hola", explanation: "Common greeting" },
          { text: "Buenos días", explanation: "Formal morning greeting" },
        ],
      },
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
      meanings: [{ sense: "greeting", options: [{ text: "Bonjour", explanation: "Hello" }] }],
    }
    render(<TranslationCard translation={singleOption} />)
    expect(screen.getByText("French")).toBeInTheDocument()
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("handles empty meanings array", () => {
    const emptyMeanings: LanguageTranslation = {
      language: { code: "de", name: "German" },
      meanings: [],
    }
    render(<TranslationCard translation={emptyMeanings} />)
    expect(screen.getByText("German")).toBeInTheDocument()
  })

  it("applies mono font to translation text", () => {
    render(<TranslationCard translation={mockTranslation} />)
    const translationText = screen.getByText("Hola")
    expect(translationText).toHaveClass("font-mono")
  })

  it("shows sense labels when there are multiple meanings", () => {
    const multipleMeanings: LanguageTranslation = {
      language: { code: "es", name: "Spanish" },
      meanings: [
        { sense: "quick, rapid", options: [{ text: "rápido", explanation: "adjective" }] },
        { sense: "immobile", options: [{ text: "firme", explanation: "held in place" }] },
      ],
    }
    render(<TranslationCard translation={multipleMeanings} />)
    expect(screen.getByText("quick, rapid")).toBeInTheDocument()
    expect(screen.getByText("immobile")).toBeInTheDocument()
  })

  it("hides sense labels when there is only one meaning", () => {
    render(<TranslationCard translation={mockTranslation} />)
    expect(screen.queryByText("greeting")).not.toBeInTheDocument()
  })
})
