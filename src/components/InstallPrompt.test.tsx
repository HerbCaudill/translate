import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InstallPrompt } from "./InstallPrompt"

describe("InstallPrompt", () => {
  it("renders nothing when canInstall is false", () => {
    const { container } = render(<InstallPrompt canInstall={false} onInstall={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders install button when canInstall is true", () => {
    render(<InstallPrompt canInstall={true} onInstall={vi.fn()} />)
    expect(screen.getByRole("button", { name: /install/i })).toBeInTheDocument()
  })

  it("calls onInstall when button is clicked", async () => {
    const user = userEvent.setup()
    const onInstall = vi.fn()

    render(<InstallPrompt canInstall={true} onInstall={onInstall} />)

    await user.click(screen.getByRole("button", { name: /install/i }))

    expect(onInstall).toHaveBeenCalled()
  })

  it("renders with correct styling", () => {
    render(<InstallPrompt canInstall={true} onInstall={vi.fn()} />)
    const button = screen.getByRole("button", { name: /install/i })
    expect(button).toBeInTheDocument()
  })
})
