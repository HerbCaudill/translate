import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { App } from "./App"
import { STORAGE_KEYS } from "@/lib/storage"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/validateApiKey", () => ({
  validateApiKey: vi.fn().mockResolvedValue({ valid: true }),
}))

vi.mock("@/lib/anthropic", () => ({
  checkCompletion: vi.fn(),
  translate: vi.fn(),
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
})

describe("App fallback translation", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("triggers translation after 2s fallback when completion check returns incomplete", async () => {
    // Setup: API key stored, completion check returns incomplete
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "incomplete" })
    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      options: [{ text: "hola", explanation: "greeting" }],
    })

    render(<App />)

    // Type text using fireEvent (works better with fake timers)
    const input = screen.getByPlaceholderText(/enter text to translate/i)
    fireEvent.change(input, { target: { value: "hello" } })

    // Advance past first debounce (useDebounce in App: 500ms)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Advance past second debounce (inside useCompletionCheck: 500ms)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Allow promises to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Verify completion check was called
    expect(anthropic.checkCompletion).toHaveBeenCalledWith("sk-ant-test123", "hello", "")

    // Translation should NOT have been called yet (incomplete status)
    expect(anthropic.translate).not.toHaveBeenCalled()

    // Advance past fallback timer (2000ms from when debouncedText stabilized)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Now translation should have been triggered via fallback
    expect(anthropic.translate).toHaveBeenCalledWith(
      "sk-ant-test123",
      "hello",
      { code: "es", name: "Spanish" },
      "",
    )
  })

  it("does not trigger fallback if completion check returns complete", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "",
        completionPrompt: "",
      }),
    )

    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })
    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      options: [{ text: "hola", explanation: "greeting" }],
    })

    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    fireEvent.change(input, { target: { value: "hello" } })

    // Advance past first debounce (useDebounce in App: 500ms)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Advance past second debounce (inside useCompletionCheck: 500ms)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Allow promises to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Translation should be called immediately due to "complete" status
    expect(anthropic.translate).toHaveBeenCalledTimes(1)

    // Clear the mock to check if it's called again
    vi.mocked(anthropic.translate).mockClear()

    // Advance past fallback timer
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Translation should NOT be called again (no double translation)
    expect(anthropic.translate).not.toHaveBeenCalled()
  })
})

describe("App history saving", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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

    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })
    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      options: [{ text: "hola", explanation: "greeting" }],
    })

    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    fireEvent.change(input, { target: { value: "hello" } })

    // Advance past debounces
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Allow promises to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Translation should be called
    expect(anthropic.translate).toHaveBeenCalled()

    // Check history was saved
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]")
    expect(history).toHaveLength(1)
    expect(history[0].input).toBe("hello")
    expect(history[0].translation.results).toHaveLength(1)
    expect(history[0].translation.results[0].language.code).toBe("es")
    expect(history[0].translation.results[0].options[0].text).toBe("hola")
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

    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })
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

    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    fireEvent.change(input, { target: { value: "hello" } })

    // Advance past debounces
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Allow promises to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Check history was saved even with partial results
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]")
    expect(history).toHaveLength(1)
    expect(history[0].input).toBe("hello")
    // Should only have the successful translation
    expect(history[0].translation.results).toHaveLength(1)
    expect(history[0].translation.results[0].language.code).toBe("es")
  })
})
