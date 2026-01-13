import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { SettingsDialog } from "./SettingsDialog"

describe("SettingsDialog", () => {
  it("renders the settings button", () => {
    render(<SettingsDialog />)
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument()
  })

  it("opens the dialog when the button is clicked", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog />)

    await user.click(screen.getByRole("button", { name: "Settings" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Configure your translation preferences.")).toBeInTheDocument()
  })

  it("closes the dialog when the close button is clicked", async () => {
    const user = userEvent.setup()
    render(<SettingsDialog />)

    await user.click(screen.getByRole("button", { name: "Settings" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders custom children as trigger", async () => {
    const user = userEvent.setup()
    render(
      <SettingsDialog>
        <button>Custom trigger</button>
      </SettingsDialog>,
    )

    expect(screen.getByRole("button", { name: "Custom trigger" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Custom trigger" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
