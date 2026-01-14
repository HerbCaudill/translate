import { render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { LanguageList } from "./LanguageList"
import { Language } from "@/types"

const defaultLanguages: Language[] = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
]

describe("LanguageList", () => {
  it("renders the list of languages", () => {
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    expect(screen.getByText("Spanish")).toBeInTheDocument()
    expect(screen.getByText("French")).toBeInTheDocument()
    expect(screen.getByText("German")).toBeInTheDocument()
  })

  it("renders language codes", () => {
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    expect(screen.getByText("es")).toBeInTheDocument()
    expect(screen.getByText("fr")).toBeInTheDocument()
    expect(screen.getByText("de")).toBeInTheDocument()
  })

  it("removes a language when remove button is clicked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageList languages={defaultLanguages} onChange={onChange} />)

    const spanishItem = screen.getByText("Spanish").closest("[data-language]") as HTMLElement
    const removeButton = within(spanishItem).getByRole("button", { name: /remove/i })

    await user.click(removeButton)

    expect(onChange).toHaveBeenCalledWith([
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
    ])
  })

  it("moves a language up when move up button is clicked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageList languages={defaultLanguages} onChange={onChange} />)

    const frenchItem = screen.getByText("French").closest("[data-language]") as HTMLElement
    const moveUpButton = within(frenchItem).getByRole("button", { name: /move up/i })

    await user.click(moveUpButton)

    expect(onChange).toHaveBeenCalledWith([
      { code: "fr", name: "French" },
      { code: "es", name: "Spanish" },
      { code: "de", name: "German" },
    ])
  })

  it("moves a language down when move down button is clicked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageList languages={defaultLanguages} onChange={onChange} />)

    const frenchItem = screen.getByText("French").closest("[data-language]") as HTMLElement
    const moveDownButton = within(frenchItem).getByRole("button", { name: /move down/i })

    await user.click(moveDownButton)

    expect(onChange).toHaveBeenCalledWith([
      { code: "es", name: "Spanish" },
      { code: "de", name: "German" },
      { code: "fr", name: "French" },
    ])
  })

  it("disables move up button for first item", () => {
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    const spanishItem = screen.getByText("Spanish").closest("[data-language]") as HTMLElement
    const moveUpButton = within(spanishItem).getByRole("button", { name: /move up/i })

    expect(moveUpButton).toBeDisabled()
  })

  it("disables move down button for last item", () => {
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    const germanItem = screen.getByText("German").closest("[data-language]") as HTMLElement
    const moveDownButton = within(germanItem).getByRole("button", { name: /move down/i })

    expect(moveDownButton).toBeDisabled()
  })

  it("adds a new language when selected from autocomplete", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageList languages={defaultLanguages} onChange={onChange} />)

    // Click the combobox to open it
    const combobox = screen.getByRole("combobox", { name: /select language/i })
    await user.click(combobox)

    // Wait for popover to open and search for Japanese
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search languages...")).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText("Search languages..."), "Japanese")

    // Click the Japanese option (cmdk items have cmdk-item attribute, find by text then get parent)
    await waitFor(() => {
      expect(screen.getByText("Japanese")).toBeInTheDocument()
    })
    const japaneseText = screen.getByText("Japanese")
    const japaneseItem = japaneseText.closest("[cmdk-item]") as HTMLElement
    await user.click(japaneseItem)

    // Click the add button
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onChange).toHaveBeenCalledWith([...defaultLanguages, { code: "ja", name: "Japanese" }])
  })

  it("clears the selection after adding a language", async () => {
    const user = userEvent.setup()
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    // Click the combobox to open it
    const combobox = screen.getByRole("combobox", { name: /select language/i })
    await user.click(combobox)

    // Select Japanese
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search languages...")).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText("Search languages..."), "Japanese")

    await waitFor(() => {
      expect(screen.getByText("Japanese")).toBeInTheDocument()
    })
    const japaneseText = screen.getByText("Japanese")
    const japaneseItem = japaneseText.closest("[cmdk-item]") as HTMLElement
    await user.click(japaneseItem)

    // Add the language
    await user.click(screen.getByRole("button", { name: /add/i }))

    // Combobox should be reset to placeholder
    expect(screen.getByRole("combobox", { name: /select language/i })).toHaveTextContent("Add a language...")
  })

  it("disables add button when no language is selected", () => {
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled()
  })

  it("excludes already added languages from autocomplete options", async () => {
    const user = userEvent.setup()
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    // Click the combobox to open it
    const combobox = screen.getByRole("combobox", { name: /select language/i })
    await user.click(combobox)

    // Wait for popover to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search languages...")).toBeInTheDocument()
    })

    // Search for Spanish (already added)
    await user.type(screen.getByPlaceholderText("Search languages..."), "Spanish")

    // Spanish should not appear in options (it's already in the list)
    await waitFor(() => {
      expect(screen.getByText("No language found.")).toBeInTheDocument()
    })
  })

  it("renders empty state when no languages", () => {
    render(<LanguageList languages={[]} onChange={vi.fn()} />)

    expect(screen.getByText("No languages configured")).toBeInTheDocument()
  })
})
