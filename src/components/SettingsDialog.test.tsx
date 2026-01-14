import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SettingsDialog } from "./SettingsDialog"
import { Language } from "@/types"

const defaultLanguages: Language[] = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
]

const defaultProps = {
  languages: defaultLanguages,
  onLanguagesChange: vi.fn(),
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

    const spanishItem = screen.getByText("Spanish").closest("[data-language]") as HTMLElement
    const removeButton = within(spanishItem).getByRole("button", { name: /remove/i })
    await user.click(removeButton)

    expect(onLanguagesChange).toHaveBeenCalledWith([{ code: "fr", name: "French" }])
  })
})
