import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { App } from "./App"
import { STORAGE_KEYS } from "@/lib/storage"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/validateApiKey", () => ({
  validateApiKey: vi.fn().mockResolvedValue({ valid: true }),
}))

vi.mock("@/lib/crypto", () => ({
  decryptApiKey: vi.fn(),
  hasEncryptedKey: vi.fn().mockResolvedValue(false),
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
      }),
    )

    render(<App />)

    expect(screen.queryByText("API key required")).not.toBeInTheDocument()
    expect(screen.getByText("Universal Translator")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()
  })

  it("shows the app icon in the header", () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [],
      }),
    )

    render(<App />)

    const icon = document.querySelector('header img[src="/icon.svg"]')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass("h-12", "w-12", "rounded-lg")
  })

  it("stores API key and shows main content after submission", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-test123")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    await waitFor(() => {
      expect(screen.getByText("Universal Translator")).toBeInTheDocument()
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
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      source: "en",
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          meanings: [{ sense: "greeting", options: [{ text: "hola", explanation: "greeting" }] }],
        },
      ],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello")

    // Click the submit button
    const submitButton = screen.getByRole("button", { name: "" })
    await user.click(submitButton)

    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledWith({
        apiKey: "sk-ant-test123",
        text: "hello",
        languages: [{ code: "es", name: "Spanish" }],
      })
    })
  })

  it("triggers translation when Enter key is pressed", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      source: "en",
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          meanings: [{ sense: "greeting", options: [{ text: "hola", explanation: "greeting" }] }],
        },
      ],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hello{Enter}")

    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledWith({
        apiKey: "sk-ant-test123",
        text: "hello",
        languages: [{ code: "es", name: "Spanish" }],
      })
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
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      source: "en",
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          meanings: [{ sense: "greeting", options: [{ text: "hola", explanation: "greeting" }] }],
        },
      ],
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
      expect(history[0].translation.results[0].meanings[0].options[0].text).toBe("hola")
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
})

describe("App initial state from history", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("shows most recent translation on first load", async () => {
    // Set up existing history with a recent translation
    localStorage.setItem(
      STORAGE_KEYS.HISTORY,
      JSON.stringify([
        {
          id: "recent-1",
          input: "good morning",
          translation: {
            input: "good morning",
            results: [
              {
                language: { code: "es", name: "Spanish" },
                meanings: [
                  {
                    sense: "morning greeting",
                    options: [{ text: "buenos días", explanation: "morning greeting" }],
                  },
                ],
              },
            ],
            timestamp: Date.now(),
          },
          createdAt: Date.now(),
        },
      ]),
    )

    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
      }),
    )

    render(<App />)

    // Input should be pre-populated with the most recent translation's input
    const input = screen.getByPlaceholderText(/enter text to translate/i)
    expect(input).toHaveValue("good morning")

    // Results should be displayed immediately
    expect(screen.getByText("buenos días")).toBeInTheDocument()
    expect(screen.getByText("morning greeting")).toBeInTheDocument()
  })

  it("shows empty state when there is no history", () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
      }),
    )

    render(<App />)

    // Input should be empty
    const input = screen.getByPlaceholderText(/enter text to translate/i)
    expect(input).toHaveValue("")

    // No results should be shown
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument()
  })
})

describe("App translation caching", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("uses cached result from history instead of calling API", async () => {
    // Set up existing history with a cached translation
    localStorage.setItem(
      STORAGE_KEYS.HISTORY,
      JSON.stringify([
        {
          id: "cached-1",
          input: "hello",
          translation: {
            input: "hello",
            results: [
              {
                language: { code: "es", name: "Spanish" },
                meanings: [
                  {
                    sense: "greeting",
                    options: [{ text: "hola (cached)", explanation: "cached greeting" }],
                  },
                ],
              },
            ],
            timestamp: Date.now(),
          },
          createdAt: Date.now(),
        },
      ]),
    )

    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
      }),
    )

    const user = userEvent.setup()
    render(<App />)

    // Clear the pre-populated input first (from most recent history entry)
    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.clear(input)
    await user.type(input, "hello{Enter}")

    // Should show cached result
    await waitFor(() => {
      expect(screen.getByText("hola (cached)")).toBeInTheDocument()
    })

    // API should NOT have been called since we used cached result
    expect(anthropic.translate).not.toHaveBeenCalled()
  })

  it("calls API when input does not match any cached entry", async () => {
    // Set up existing history with a different translation
    localStorage.setItem(
      STORAGE_KEYS.HISTORY,
      JSON.stringify([
        {
          id: "cached-1",
          input: "goodbye",
          translation: {
            input: "goodbye",
            results: [
              {
                language: { code: "es", name: "Spanish" },
                meanings: [
                  { sense: "farewell", options: [{ text: "adiós", explanation: "farewell" }] },
                ],
              },
            ],
            timestamp: Date.now(),
          },
          createdAt: Date.now(),
        },
      ]),
    )

    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [{ code: "es", name: "Spanish" }],
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      source: "en",
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          meanings: [{ sense: "greeting", options: [{ text: "hola", explanation: "greeting" }] }],
        },
      ],
    })

    const user = userEvent.setup()
    render(<App />)

    // Clear the pre-populated input first (from most recent history entry)
    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.clear(input)
    await user.type(input, "hello{Enter}")

    // API should be called since "hello" is not in history
    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledWith({
        apiKey: "sk-ant-test123",
        text: "hello",
        languages: [{ code: "es", name: "Spanish" }],
      })
    })
  })
})

describe("App alternate source selection", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("shows alternate source buttons when translation has alternateSources", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ],
      }),
    )

    vi.mocked(anthropic.translate).mockResolvedValue({
      success: true,
      source: "es",
      alternateSources: ["fr"],
      translations: [
        {
          language: { code: "en", name: "English" },
          meanings: [{ sense: "greeting", options: [{ text: "hello", explanation: "greeting" }] }],
        },
        {
          language: { code: "fr", name: "French" },
          meanings: [{ sense: "greeting", options: [{ text: "salut", explanation: "greeting" }] }],
        },
      ],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "hola{Enter}")

    // Wait for translation to complete
    await waitFor(() => {
      expect(screen.getByText("Translated from")).toBeInTheDocument()
    })

    // Should show "Not right?" with alternate source button
    expect(screen.getByText("Not right?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /translate as french/i })).toBeInTheDocument()
  })

  it("re-translates with sourceLanguageHint when alternate source is clicked", async () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ],
      }),
    )

    // First translation - detected as Spanish with French as alternate
    vi.mocked(anthropic.translate).mockResolvedValueOnce({
      success: true,
      source: "es",
      alternateSources: ["fr"],
      translations: [
        {
          language: { code: "en", name: "English" },
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "hello (from Spanish)", explanation: "greeting" }],
            },
          ],
        },
        {
          language: { code: "fr", name: "French" },
          meanings: [{ sense: "greeting", options: [{ text: "salut", explanation: "greeting" }] }],
        },
      ],
    })

    // Second translation - with French as source hint
    vi.mocked(anthropic.translate).mockResolvedValueOnce({
      success: true,
      source: "fr",
      translations: [
        {
          language: { code: "en", name: "English" },
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "hello (from French)", explanation: "greeting" }],
            },
          ],
        },
        {
          language: { code: "es", name: "Spanish" },
          meanings: [{ sense: "greeting", options: [{ text: "hola", explanation: "greeting" }] }],
        },
      ],
    })

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/enter text to translate/i)
    await user.type(input, "salut{Enter}")

    // Wait for first translation to complete
    await waitFor(() => {
      expect(screen.getByText("hello (from Spanish)")).toBeInTheDocument()
    })

    // Click the French alternate source button
    const frenchButton = screen.getByRole("button", { name: /translate as french/i })
    await user.click(frenchButton)

    // Should call translate again with sourceLanguageHint
    await waitFor(() => {
      expect(anthropic.translate).toHaveBeenCalledTimes(2)
      expect(anthropic.translate).toHaveBeenLastCalledWith({
        apiKey: "sk-ant-test123",
        text: "salut",
        languages: [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ],
        sourceLanguageHint: "fr",
      })
    })

    // Should show updated translation
    await waitFor(() => {
      expect(screen.getByText("hello (from French)")).toBeInTheDocument()
    })
  })

  it("shows alternate sources from history entry", async () => {
    // Set up history with alternateSources
    localStorage.setItem(
      STORAGE_KEYS.HISTORY,
      JSON.stringify([
        {
          id: "history-1",
          input: "ciao",
          translation: {
            input: "ciao",
            source: "it",
            alternateSources: ["es"],
            results: [
              {
                language: { code: "en", name: "English" },
                meanings: [
                  { sense: "greeting", options: [{ text: "hello", explanation: "greeting" }] },
                ],
              },
            ],
            timestamp: Date.now(),
          },
          createdAt: Date.now(),
        },
      ]),
    )

    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        apiKey: "sk-ant-test123",
        languages: [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "it", name: "Italian" },
        ],
      }),
    )

    render(<App />)

    // Should show alternate source button from history entry
    await waitFor(() => {
      expect(screen.getByText("Not right?")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /translate as spanish/i })).toBeInTheDocument()
    })
  })
})
