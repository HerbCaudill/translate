import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeEach } from "vitest"
import { TranslationResults } from "./TranslationResults"
import { STORAGE_KEYS } from "@/lib/storage"
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

  beforeEach(() => {
    localStorage.clear()
  })

  it("renders all language tabs", () => {
    render(<TranslationResults results={mockResults} />)
    expect(screen.getByRole("tab", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "French" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "German" })).toBeInTheDocument()
  })

  it("shows first language content by default", () => {
    render(<TranslationResults results={mockResults} />)
    // First tab should be selected and its content visible
    expect(screen.getByText("Hola")).toBeInTheDocument()
    expect(screen.getByText("Common greeting")).toBeInTheDocument()
    expect(screen.getByText("Buenos días")).toBeInTheDocument()
  })

  it("switches tab content when clicking different tab", async () => {
    const user = userEvent.setup()
    render(<TranslationResults results={mockResults} />)

    // Click on French tab
    await user.click(screen.getByRole("tab", { name: "French" }))

    // French content should now be visible
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("returns null when no results", () => {
    const { container } = render(<TranslationResults results={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("remembers selected tab in localStorage", async () => {
    const user = userEvent.setup()
    render(<TranslationResults results={mockResults} />)

    // Click on German tab
    await user.click(screen.getByRole("tab", { name: "German" }))

    // Check localStorage was updated
    expect(localStorage.getItem(STORAGE_KEYS.SELECTED_TAB)).toBe('"de"')
  })

  it("restores selected tab from localStorage", () => {
    // Set up localStorage before rendering
    localStorage.setItem(STORAGE_KEYS.SELECTED_TAB, JSON.stringify("fr"))

    render(<TranslationResults results={mockResults} />)

    // French tab should be selected
    expect(screen.getByRole("tab", { name: "French" })).toHaveAttribute(
      "data-state",
      "active",
    )
    // French content should be visible
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
  })

  it("falls back to first tab when stored tab is not in results", () => {
    // Set up localStorage with a language not in results
    localStorage.setItem(STORAGE_KEYS.SELECTED_TAB, JSON.stringify("pt"))

    render(<TranslationResults results={mockResults} />)

    // First tab (Spanish) should be selected
    expect(screen.getByRole("tab", { name: "Spanish" })).toHaveAttribute(
      "data-state",
      "active",
    )
    expect(screen.getByText("Hola")).toBeInTheDocument()
  })

  it("applies serif font to translation text", () => {
    render(<TranslationResults results={mockResults} />)
    const translationText = screen.getByText("Hola")
    expect(translationText).toHaveClass("font-serif")
  })
})
