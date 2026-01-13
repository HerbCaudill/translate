import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { App } from "./App"
import { STORAGE_KEYS } from "@/lib/storage"

describe("App", () => {
  beforeEach(() => {
    localStorage.clear()
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
    expect(screen.getByText("Hello, world")).toBeInTheDocument()
  })

  it("stores API key and shows main content after submission", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText("API key"), "sk-ant-test123")
    await user.click(screen.getByRole("button", { name: /save api key/i }))

    expect(screen.getByText("Hello, world")).toBeInTheDocument()
    expect(screen.queryByText("API key required")).not.toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || "{}")
    expect(stored.apiKey).toBe("sk-ant-test123")
  })
})
