import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { App } from "./App"
import { STORAGE_KEYS } from "@/lib/storage"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/validateApiKey", () => ({
  validateApiKey: vi.fn().mockResolvedValue({ valid: true }),
}))

vi.mock("@/lib/anthropic", () => ({
  translate: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe("App", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("shows ApiKeyPrompt when no API key is stored", () => {
    render(<App />)

    expect(screen.getByText("API key required")).toBeInTheDocument()
  })

  it("shows main content when API key is stored", () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    render(<App />)

    expect(screen.queryByText("API key required")).not.toBeInTheDocument()
    expect(screen.getByText("Translate")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()
  })

  it("stores API key and shows main content after submission", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-test123")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    await waitFor(() => {
      expect(screen.getByText("Translate")).toBeInTheDocument()
    })
    expect(screen.queryByText("API key required")).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || "{}")
    expect(stored.apiKey).toBe("sk-ant-test123")
  })

  it("triggers translation when submit button is clicked", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      options: [{ text: "hola", explanation: "greeting" }],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello")

    // Click the submit button
    const submitButton = screen.getByRole("button", { name: "" })
    await user.click(submitButton)

    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledWith(
        "sk-ant-test123",
        "hello",
        { code: "es", name: "Spanish" },
        "",
      )
    })
  })

  it("triggers translation when Enter key is pressed", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      options: [{ text: "hola", explanation: "greeting" }],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello{Enter}")

    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledWith(
        "sk-ant-test123",
        "hello",
        { code: "es", name: "Spanish" },
        "",
      )
    })
  })
})

describe("App history saving", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("saves translation to history when translation completes", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      options: [{ text: "hola", explanation: "greeting" }],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello{Enter}")

    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalled()
    })

    // Check history was saved
    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]")
      expect(history).toHaveLength(1)
      expect(history[0].input).toBe("hello")
      expect(history[0].translation.results).toHaveLength(1)
      expect(history[0].translation.results[0].language.code).toBe("es")
      expect(history[0].translation.results[0].options[0].text).toBe("hola")
    })
  })

  it("saves partial translations to history", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    // One succeeds, one fails - partial result
    vi.mocked(anthropic.translate)
      .mockResolvedValueOnce({
        success: true,
        options: [{ text: "hola", explanation: "greeting" }],
      })
      .mockResolvedValueOnce({
        success: false,
        error: "API error",
      })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello{Enter}")

    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledTimes(2)
    })

    // Check history was saved even with partial results
    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]")
      expect(history).toHaveLength(1)
      expect(history[0].input).toBe("hello")
      // Should only have the successful translation
      expect(history[0].translation.results).toHaveLength(1)
      expect(history[0].translation.results[0].language.code).toBe("es")
    })
  })
})

describe("App error toasts", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("shows toast when translation fails", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: false,
      error: "API rate limit exceeded",
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello{Enter}")

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Translation failed",
        expect.objectContaining({
          description: "API rate limit exceeded",
          action: expect.objectContaining({
            label: "Retry",
          }),
        }),
      )
    })
  })

  it("shows toast when partial translation fails", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.translate)
      .mockResolvedValueOnce({
        success: true,
        options: [{ text: "hola", explanation: "greeting" }],
      })
      .mockResolvedValueOnce({
        success: false,
        error: "French translation failed",
      })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello{Enter}")

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Translation failed",
        expect.objectContaining({
          description: "French translation failed",
        }),
      )
    })
  })
})
