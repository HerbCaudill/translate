import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { TranslationResults } from "./TranslationResults"
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

  const defaultProps = {
    results: mockResults,
    languages: mockLanguages,
    sourceLanguage: "en",
    selectedTab: "es",
    onTabChange: vi.fn(),
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("renders language tabs excluding the source language", () => {
    render(<TranslationResults {...defaultProps} />)
    expect(screen.queryByRole("tab", { name: "English" })).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Spanish" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "French" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "German" })).toBeInTheDocument()
  })

  it("shows selected tab content", () => {
    render(<TranslationResults {...defaultProps} selectedTab="es" />)
    // Spanish should be selected and its content visible
    expect(screen.getByRole("tab", { name: "Spanish" })).toHaveAttribute("data-state", "active")
    expect(screen.getByText("Hola")).toBeInTheDocument()
    expect(screen.getByText("Common greeting")).toBeInTheDocument()
    expect(screen.getByText("Buenos días")).toBeInTheDocument()
  })

  it("calls onTabChange when clicking different tab", async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(<TranslationResults {...defaultProps} onTabChange={onTabChange} />)

    // Click on French tab
    await user.click(screen.getByRole("tab", { name: "French" }))

    // onTabChange should be called with the French language code
    expect(onTabChange).toHaveBeenCalledWith("fr")
  })

  it("returns null when no languages", () => {
    const { container } = render(
      <TranslationResults {...defaultProps} results={[]} languages={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("applies mono font to translation text", () => {
    render(<TranslationResults {...defaultProps} />)
    const translationText = screen.getByText("Hola")
    expect(translationText).toHaveClass("font-mono")
  })

  it("renders refresh button when onRefresh is provided", () => {
    const onRefresh = vi.fn()
    render(<TranslationResults {...defaultProps} onRefresh={onRefresh} />)
    expect(screen.getByRole("button", { name: "Refresh translation" })).toBeInTheDocument()
  })

  it("does not render refresh button when onRefresh is not provided", () => {
    render(<TranslationResults {...defaultProps} />)
    expect(screen.queryByRole("button", { name: "Refresh translation" })).not.toBeInTheDocument()
  })

  it("calls onRefresh when refresh button is clicked", async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(<TranslationResults {...defaultProps} onRefresh={onRefresh} />)

    await user.click(screen.getByRole("button", { name: "Refresh translation" }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it("disables refresh button and shows spinner when isRefreshing is true", () => {
    const onRefresh = vi.fn()
    render(<TranslationResults {...defaultProps} onRefresh={onRefresh} isRefreshing={true} />)

    const refreshButton = screen.getByRole("button", { name: "Refresh translation" })
    expect(refreshButton).toBeDisabled()
    // Check for the animate-spin class on the icon
    const icon = refreshButton.querySelector("svg")
    expect(icon).toHaveClass("animate-spin")
  })

  it("renders three skeleton option placeholders when loading", () => {
    const { container } = render(<TranslationResults {...defaultProps} results={[]} isLoading />)
    // Each option has 2 skeletons (text + explanation), 3 options = 6 skeletons
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBe(6)
  })

  it("hides tabs and shows skeleton when isTyping is true", () => {
    const { container } = render(<TranslationResults {...defaultProps} isTyping />)
    // Tabs should not be visible
    expect(screen.queryByRole("tab")).not.toBeInTheDocument()
    // Skeleton should be visible instead of translation content
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
    // Translation content should not be visible
    expect(screen.queryByText("Hola")).not.toBeInTheDocument()
  })

  it("hides 'Translated from' banner when isTyping is true", () => {
    render(<TranslationResults {...defaultProps} isTyping />)
    expect(screen.queryByText(/Translated from/)).not.toBeInTheDocument()
  })

  it("uses flex layout to fill available vertical space for swipe target", () => {
    const { container } = render(<TranslationResults {...defaultProps} />)

    // The root Tabs element should have flex-1 to fill available space
    const tabsRoot = container.querySelector('[data-slot="tabs"]')
    expect(tabsRoot).toHaveClass("flex-1", "flex", "flex-col")

    // The TabsContent should also use flex-1 to stretch
    const tabsContent = container.querySelector('[data-slot="tabs-content"]')
    expect(tabsContent).toHaveClass("flex-1", "flex", "flex-col")

    // The inner swipe target div should have flex-1 to fill remaining space
    const swipeTarget = tabsContent?.querySelector(".touch-pan-y")
    expect(swipeTarget).toHaveClass("flex-1")
  })

  describe("alternate source selection", () => {
    it("does not show alternate source buttons when alternateSources is not provided", () => {
      render(<TranslationResults {...defaultProps} />)
      expect(screen.queryByText("Not right?")).not.toBeInTheDocument()
    })

    it("does not show alternate source buttons when alternateSources is empty", () => {
      const onAlternateSourceSelect = vi.fn()
      render(
        <TranslationResults
          {...defaultProps}
          alternateSources={[]}
          onAlternateSourceSelect={onAlternateSourceSelect}
        />,
      )
      expect(screen.queryByText("Not right?")).not.toBeInTheDocument()
    })

    it("does not show alternate source buttons when onAlternateSourceSelect is not provided", () => {
      render(<TranslationResults {...defaultProps} alternateSources={["es", "fr"]} />)
      expect(screen.queryByText("Not right?")).not.toBeInTheDocument()
    })

    it("shows alternate source buttons when alternateSources and onAlternateSourceSelect are provided", () => {
      const onAlternateSourceSelect = vi.fn()
      render(
        <TranslationResults
          {...defaultProps}
          alternateSources={["es", "fr"]}
          onAlternateSourceSelect={onAlternateSourceSelect}
        />,
      )
      expect(screen.getByText("Not right?")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Translate as Spanish" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Translate as French" })).toBeInTheDocument()
    })

    it("calls onAlternateSourceSelect with the language code when clicking an alternate source button", async () => {
      const user = userEvent.setup()
      const onAlternateSourceSelect = vi.fn()
      render(
        <TranslationResults
          {...defaultProps}
          alternateSources={["es", "fr"]}
          onAlternateSourceSelect={onAlternateSourceSelect}
        />,
      )

      await user.click(screen.getByRole("button", { name: "Translate as French" }))
      expect(onAlternateSourceSelect).toHaveBeenCalledWith("fr")
    })

    it("displays language code when language name is not found in languages list", () => {
      const onAlternateSourceSelect = vi.fn()
      render(
        <TranslationResults
          {...defaultProps}
          alternateSources={["it"]}
          onAlternateSourceSelect={onAlternateSourceSelect}
        />,
      )
      // Should fall back to displaying the code when name not found
      expect(screen.getByRole("button", { name: "Translate as it" })).toBeInTheDocument()
    })

    it("hides alternate source buttons when isLoading is true", () => {
      const onAlternateSourceSelect = vi.fn()
      render(
        <TranslationResults
          {...defaultProps}
          alternateSources={["es"]}
          onAlternateSourceSelect={onAlternateSourceSelect}
          isLoading
        />,
      )
      expect(screen.queryByText("Not right?")).not.toBeInTheDocument()
    })

    it("hides alternate source buttons when isTyping is true", () => {
      const onAlternateSourceSelect = vi.fn()
      render(
        <TranslationResults
          {...defaultProps}
          alternateSources={["es"]}
          onAlternateSourceSelect={onAlternateSourceSelect}
          isTyping
        />,
      )
      expect(screen.queryByText("Not right?")).not.toBeInTheDocument()
    })
  })
})
