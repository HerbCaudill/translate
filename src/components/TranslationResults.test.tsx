import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { TranslationResults } from "./TranslationResults"
import { STORAGE_KEYS } from "@/lib/storage"
import type { Language, LanguageTranslation } from "@/types"

describe("TranslationResults", () => {
  const mockLanguages: Language[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ]

  const mockResults: LanguageTranslation[] = [
    {
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
    },
    {
      language: { code: "fr", name: "French" },
      meanings: [{ sense: "greeting", options: [{ text: "Bonjour", explanation: "Hello" }] }],
    },
    {
      language: { code: "de", name: "German" },
      meanings: [
        { sense: "greeting", options: [{ text: "Hallo", explanation: "Informal greeting" }] },
      ],
    },
  ]

  beforeEach(() => {
    localStorage.clear()
  })

  it("renders all language tabs including source language", () => {
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )
    expect(screen.getByRole("tab", { name: "English" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "French" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "German" })).toBeInTheDocument()
  })

  it("disables source language tab", () => {
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )
    expect(screen.getByRole("tab", { name: "English" })).toBeDisabled()
  })

  it("shows first non-source language content by default", () => {
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )
    // Spanish (first non-source) should be selected and its content visible
    expect(screen.getByRole("tab", { name: "Spanish" })).toHaveAttribute("data-state", "active")
    expect(screen.getByText("Hola")).toBeInTheDocument()
    expect(screen.getByText("Common greeting")).toBeInTheDocument()
    expect(screen.getByText("Buenos días")).toBeInTheDocument()
  })

  it("switches tab content when clicking different tab", async () => {
    const user = userEvent.setup()
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )

    // Click on French tab
    await user.click(screen.getByRole("tab", { name: "French" }))

    // French content should now be visible
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("returns null when no results", () => {
    const { container } = render(<TranslationResults results={[]} languages={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("remembers selected tab in localStorage", async () => {
    const user = userEvent.setup()
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )

    // Click on German tab
    await user.click(screen.getByRole("tab", { name: "German" }))

    // Check localStorage was updated
    expect(localStorage.getItem(STORAGE_KEYS.SELECTED_TAB)).toBe('"de"')
  })

  it("restores selected tab from localStorage", () => {
    // Set up localStorage before rendering
    localStorage.setItem(STORAGE_KEYS.SELECTED_TAB, JSON.stringify("fr"))

    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )

    // French tab should be selected
    expect(screen.getByRole("tab", { name: "French" })).toHaveAttribute("data-state", "active")
    // French content should be visible
    expect(screen.getByText("Bonjour")).toBeInTheDocument()
  })

  it("falls back to first non-source tab when stored tab is not in languages", () => {
    // Set up localStorage with a language not in languages
    localStorage.setItem(STORAGE_KEYS.SELECTED_TAB, JSON.stringify("pt"))

    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )

    // First non-source tab (Spanish) should be selected
    expect(screen.getByRole("tab", { name: "Spanish" })).toHaveAttribute("data-state", "active")
    expect(screen.getByText("Hola")).toBeInTheDocument()
  })

  it("applies mono font to translation text", () => {
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )
    const translationText = screen.getByText("Hola")
    expect(translationText).toHaveClass("font-mono")
  })

  it("renders refresh button when onRefresh is provided", () => {
    const onRefresh = vi.fn()
    render(
      <TranslationResults
        results={mockResults}
        languages={mockLanguages}
        sourceLanguage="en"
        onRefresh={onRefresh}
      />,
    )
    expect(screen.getByRole("button", { name: "Refresh translation" })).toBeInTheDocument()
  })

  it("does not render refresh button when onRefresh is not provided", () => {
    render(
      <TranslationResults results={mockResults} languages={mockLanguages} sourceLanguage="en" />,
    )
    expect(screen.queryByRole("button", { name: "Refresh translation" })).not.toBeInTheDocument()
  })

  it("calls onRefresh when refresh button is clicked", async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(
      <TranslationResults
        results={mockResults}
        languages={mockLanguages}
        sourceLanguage="en"
        onRefresh={onRefresh}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Refresh translation" }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it("disables refresh button and shows spinner when isRefreshing is true", () => {
    const onRefresh = vi.fn()
    render(
      <TranslationResults
        results={mockResults}
        languages={mockLanguages}
        sourceLanguage="en"
        onRefresh={onRefresh}
        isRefreshing={true}
      />,
    )

    const refreshButton = screen.getByRole("button", { name: "Refresh translation" })
    expect(refreshButton).toBeDisabled()
    // Check for the animate-spin class on the icon
    const icon = refreshButton.querySelector("svg")
    expect(icon).toHaveClass("animate-spin")
  })
})
