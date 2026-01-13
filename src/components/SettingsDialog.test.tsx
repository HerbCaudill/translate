import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SettingsDialog } from "./SettingsDialog"
import { Language } from "@/types"
import { DEFAULT_SETTINGS } from "@/hooks/useSettings"

const defaultLanguages: Language[] = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
]

const defaultProps = {
  languages: defaultLanguages,
  onLanguagesChange: vi.fn(),
  translationPrompt: DEFAULT_SETTINGS.translationPrompt,
  onTranslationPromptChange: vi.fn(),
}

describe("SettingsDialog", () => {
  it("renders the settings button", () => {
    render(<SettingsDialog {...defaultProps} />)
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument()
  })

  it("opens the dialog when the button is clicked", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Configure your translation preferences.")).toBeInTheDocument()
  })

  it("closes the dialog when the close button is clicked", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders custom children as trigger", async () => {
    const user = userEvent.setup()
    render(
      <SettingsDialog {...defaultProps}>
        <button>Custom trigger</button>
      </SettingsDialog>,
    )

    expect(screen.getByRole("button", { name: "Custom trigger" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Custom trigger" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("displays the language list when dialog is open", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByText("Target languages")).toBeInTheDocument()
    expect(screen.getByText("Spanish")).toBeInTheDocument()
    expect(screen.getByText("French")).toBeInTheDocument()
  })

  it("calls onLanguagesChange when a language is removed", async () => {
    const user = userEvent.setup()
    const onLanguagesChange = vi.fn()
    render(<SettingsDialog {...defaultProps} onLanguagesChange={onLanguagesChange} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    const spanishItem = screen.getByText("Spanish").closest("[data-language]")!
    const removeButton = within(spanishItem).getByRole("button", { name: /remove/i })
    await user.click(removeButton)

    expect(onLanguagesChange).toHaveBeenCalledWith([{ code: "fr", name: "French" }])
  })

  it("displays the translation prompt textarea when dialog is open", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByText("Translation prompt")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Translation prompt" })).toBeInTheDocument()
    expect(screen.getByText(/Use.*as a placeholder/)).toBeInTheDocument()
  })

  it("shows the current translation prompt value", async () => {
    const user = userEvent.setup()
    const customPrompt = "Custom translation prompt text"
    render(<SettingsDialog {...defaultProps} translationPrompt={customPrompt} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByRole("textbox", { name: "Translation prompt" })).toHaveValue(customPrompt)
  })

  it("calls onTranslationPromptChange when the prompt is edited", async () => {
    const user = userEvent.setup()
    const onTranslationPromptChange = vi.fn()
    render(
      <SettingsDialog
        {...defaultProps}
        translationPrompt=""
        onTranslationPromptChange={onTranslationPromptChange}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.type(screen.getByRole("textbox", { name: "Translation prompt" }), "New prompt")

    expect(onTranslationPromptChange).toHaveBeenCalled()
  })

  it("disables reset button when prompt is default", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByRole("button", { name: /reset to default/i })).toBeDisabled()
  })

  it("enables reset button when prompt differs from default", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog {...defaultProps} translationPrompt="Custom prompt" />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByRole("button", { name: /reset to default/i })).toBeEnabled()
  })

  it("resets prompt to default when reset button is clicked", async () => {
    const user = userEvent.setup()
    const onTranslationPromptChange = vi.fn()
    render(
      <SettingsDialog
        {...defaultProps}
        translationPrompt="Custom prompt"
        onTranslationPromptChange={onTranslationPromptChange}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Settings" }))
    await user.click(screen.getByRole("button", { name: /reset to default/i }))

    expect(onTranslationPromptChange).toHaveBeenCalledWith(DEFAULT_SETTINGS.translationPrompt)
  })
})
