import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TranslationResults } from "./TranslationResults"
import type { LanguageTranslation } from "@/types"

describe("TranslationResults", () => {
  const mockResults: LanguageTranslation[] = [
    {
      language: { code: "es", name: "Spanish" },
      options: [
        { text: "Hola", explanation: "Common greeting" },
        { text: "Buenos días", explanation: "Formal morning greeting" },
      ],
    },
    {
      language: { code: "fr", name: "French" },
      options: [{ text: "Bonjour", explanation: "Hello" }],
    },
    {
      language: { code: "de", name: "German" },
      options: [{ text: "Hallo", explanation: "Informal greeting" }],
    },
  ]

  it("renders all translation cards", () => {
    render(<TranslationResults results={mockResults} />)
    expect(screen.getByText("Spanish")).toBeInTheDocument()
    expect(screen.getByText("French")).toBeInTheDocument()
    expect(screen.getByText("German")).toBeInTheDocument()
  })

  it("renders translation options within cards", () => {
    render(<TranslationResults results={mockResults} />)
    expect(screen.getByText("Hola")).toBeInTheDocument()
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
    expect(screen.getByText("Hallo")).toBeInTheDocument()
  })

  it("renders explanations", () => {
    render(<TranslationResults results={mockResults} />)
    expect(screen.getByText("Common greeting")).toBeInTheDocument()
    expect(screen.getByText("Formal morning greeting")).toBeInTheDocument()
  })

  it("renders empty state when no results", () => {
    render(<TranslationResults results={[]} />)
    expect(screen.queryByRole("article")).not.toBeInTheDocument()
  })

  it("applies grid layout class", () => {
    const { container } = render(<TranslationResults results={mockResults} />)
    const grid = container.firstChild
    expect(grid).toHaveClass("grid")
  })

  it("sets data-language attributes on cards", () => {
    render(<TranslationResults results={mockResults} />)
    expect(document.querySelector('[data-language="es"]')).toBeInTheDocument()
    expect(document.querySelector('[data-language="fr"]')).toBeInTheDocument()
    expect(document.querySelector('[data-language="de"]')).toBeInTheDocument()
  })
})
