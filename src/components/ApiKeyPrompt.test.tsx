import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ApiKeyPrompt } from "./ApiKeyPrompt"

vi.mock("@/lib/validateApiKey", () => ({
  validateApiKey: vi.fn(),
}))

import { validateApiKey } from "@/lib/validateApiKey"

const mockValidateApiKey = validateApiKey as ReturnType<typeof vi.fn>

describe("ApiKeyPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateApiKey.mockResolvedValue({ valid: true })
  })
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
    let resolveValidation: (value: { valid: true }) => void
    mockValidateApiKey.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveValidation = resolve
        }),
    )
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ApiKeyPrompt onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-test123")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    expect(screen.getByRole("button", { name: /validating/i })).toBeDisabled()
    expect(screen.getByLabelText("API key")).toBeDisabled()

    resolveValidation!({ valid: true })
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

  it("displays error when validation fails", async () => {
    const user = userEvent.setup()
    mockValidateApiKey.mockResolvedValue({ valid: false, error: "Invalid API key" })
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ApiKeyPrompt onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-invalid")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    await waitFor(() => {
      expect(screen.getByText("Invalid API key")).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("clears error when submitting again", async () => {
    const user = userEvent.setup()
    mockValidateApiKey
      .mockResolvedValueOnce({ valid: false, error: "Invalid API key" })
      .mockResolvedValueOnce({ valid: true })
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ApiKeyPrompt onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-invalid")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    await waitFor(() => {
      expect(screen.getByText("Invalid API key")).toBeInTheDocument()
    })

    await user.clear(screen.getByLabelText("API key"))
    await user.type(screen.getByLabelText("API key"), "sk-ant-valid")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    await waitFor(() => {
      expect(screen.queryByText("Invalid API key")).not.toBeInTheDocument()
    })
    expect(onSubmit).toHaveBeenCalledWith("sk-ant-valid")
  })
})
