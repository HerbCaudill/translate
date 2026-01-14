import { render, screen, within } from "@testing-library/react"
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

  it("adds a new language when add form is submitted", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageList languages={defaultLanguages} onChange={onChange} />)

    await user.type(screen.getByPlaceholderText("Code (e.g. ja)"), "ja")
    await user.type(screen.getByPlaceholderText("Name (e.g. Japanese)"), "Japanese")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onChange).toHaveBeenCalledWith([...defaultLanguages, { code: "ja", name: "Japanese" }])
  })

  it("clears the add form after submission", async () => {
    const user = userEvent.setup()
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    const codeInput = screen.getByPlaceholderText("Code (e.g. ja)")
    const nameInput = screen.getByPlaceholderText("Name (e.g. Japanese)")

    await user.type(codeInput, "ja")
    await user.type(nameInput, "Japanese")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(codeInput).toHaveValue("")
    expect(nameInput).toHaveValue("")
  })

  it("disables add button when code or name is empty", () => {
    render(<LanguageList languages={defaultLanguages} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled()
  })

  it("prevents adding duplicate language codes", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageList languages={defaultLanguages} onChange={onChange} />)

    await user.type(screen.getByPlaceholderText("Code (e.g. ja)"), "es")
    await user.type(screen.getByPlaceholderText("Name (e.g. Japanese)"), "Español")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText("Language code already exists")).toBeInTheDocument()
  })

  it("renders empty state when no languages", () => {
    render(<LanguageList languages={[]} onChange={vi.fn()} />)

    expect(screen.getByText("No languages configured")).toBeInTheDocument()
  })
})
