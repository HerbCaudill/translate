import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ApiKeyPrompt } from "./ApiKeyPrompt"

describe("ApiKeyPrompt", () => {
  it("renders the form with title and input", () => {
    render(<ApiKeyPrompt onSubmit={vi.fn()} />)

    expect(screen.getByText("API key required")).toBeInTheDocument()
    expect(screen.getByLabelText("API key")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save api key/i })).toBeInTheDocument()
  })

  it("has autofocus on the input", () => {
    render(<ApiKeyPrompt onSubmit={vi.fn()} />)

    expect(screen.getByLabelText("API key")).toHaveFocus()
  })

  it("disables the button when input is empty", () => {
    render(<ApiKeyPrompt onSubmit={vi.fn()} />)

    expect(screen.getByRole("button", { name: /save api key/i })).toBeDisabled()
  })

  it("enables the button when input has value", async () => {
    const user = userEvent.setup()
    render(<ApiKeyPrompt onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-test123")

    expect(screen.getByRole("button", { name: /save api key/i })).toBeEnabled()
  })

  it("calls onSubmit with trimmed API key", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ApiKeyPrompt onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("API key"), "  sk-ant-test123  ")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    expect(onSubmit).toHaveBeenCalledWith("sk-ant-test123")
  })

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void
    const onSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveSubmit = resolve
        }),
    )
    render(<ApiKeyPrompt onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-test123")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    expect(screen.getByRole("button", { name: /validating/i })).toBeDisabled()
    expect(screen.getByLabelText("API key")).toBeDisabled()

    resolveSubmit!()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save api key/i })).toBeEnabled()
    })
  })

  it("renders link to Anthropic Console", () => {
    render(<ApiKeyPrompt onSubmit={vi.fn()} />)

    const link = screen.getByRole("link", { name: /anthropic console/i })
    expect(link).toHaveAttribute("href", "https://console.anthropic.com/settings/keys")
    expect(link).toHaveAttribute("target", "_blank")
  })
})
