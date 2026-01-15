import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { HistoryView } from "./HistoryView"
import { HistoryEntry, Translation } from "@/types"

const createMockTranslation = (input: string): Translation => ({
  input,
  results: [
    {
      language: { code: "es", name: "Spanish" },
      options: [{ text: "Hola", explanation: "Common greeting" }],
    },
  ],
  timestamp: Date.now(),
})

const createMockEntry = (id: string, input: string, createdAt: number): HistoryEntry => ({
  id,
  input,
  translation: createMockTranslation(input),
  createdAt,
})

describe("HistoryView", () => {
  it("renders empty state when no history", () => {
    render(
      <HistoryView history={[]} onSelectEntry={vi.fn()} onRemoveEntry={vi.fn()} onClearHistory={vi.fn()} />,
    )

    expect(screen.getByText("No history yet")).toBeInTheDocument()
  })

  it("renders history entries", () => {
    const history = [
      createMockEntry("1", "Hello world", Date.now()),
      createMockEntry("2", "Good morning", Date.now() - 1000),
    ]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    expect(screen.getByText("Hello world")).toBeInTheDocument()
    expect(screen.getByText("Good morning")).toBeInTheDocument()
  })

  it("calls onSelectEntry when clicking an entry", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]
    const onSelectEntry = vi.fn()

    render(
      <HistoryView
        history={history}
        onSelectEntry={onSelectEntry}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    await user.click(screen.getByText("Hello world"))

    expect(onSelectEntry).toHaveBeenCalledWith(history[0])
  })

  it("filters entries by search query", async () => {
    const user = userEvent.setup()
    const history = [
      createMockEntry("1", "Hello world", Date.now()),
      createMockEntry("2", "Good morning", Date.now() - 1000),
      createMockEntry("3", "Hello there", Date.now() - 2000),
    ]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    const searchInput = screen.getByPlaceholderText("Search history...")
    await user.type(searchInput, "Hello")

    expect(screen.getByText("Hello world")).toBeInTheDocument()
    expect(screen.getByText("Hello there")).toBeInTheDocument()
    expect(screen.queryByText("Good morning")).not.toBeInTheDocument()
  })

  it("shows clear history button", () => {
    const history = [createMockEntry("1", "Hello world", Date.now())]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument()
  })

  it("calls onClearHistory when clicking clear button", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]
    const onClearHistory = vi.fn()

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={onClearHistory}
      />,
    )

    await user.click(screen.getByRole("button", { name: /clear/i }))

    expect(onClearHistory).toHaveBeenCalled()
  })

  it("hides clear button when history is empty", () => {
    render(
      <HistoryView history={[]} onSelectEntry={vi.fn()} onRemoveEntry={vi.fn()} onClearHistory={vi.fn()} />,
    )

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument()
  })

  it("shows no results message when search yields no matches", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    const searchInput = screen.getByPlaceholderText("Search history...")
    await user.type(searchInput, "xyz")

    expect(screen.getByText("No matching entries")).toBeInTheDocument()
  })

  it("displays relative time for recent entries", () => {
    const now = Date.now()
    const history = [createMockEntry("1", "Hello world", now)]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    // Should show something like "just now" or similar relative time
    expect(screen.getByText(/now|seconds?|minutes?/i)).toBeInTheDocument()
  })

  it("search is case-insensitive", async () => {
    const user = userEvent.setup()
    const history = [
      createMockEntry("1", "Hello World", Date.now()),
      createMockEntry("2", "Good morning", Date.now() - 1000),
    ]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    const searchInput = screen.getByPlaceholderText("Search history...")
    await user.type(searchInput, "hello")

    expect(screen.getByText("Hello World")).toBeInTheDocument()
    expect(screen.queryByText("Good morning")).not.toBeInTheDocument()
  })

  it("renders history list in a scrolling container", () => {
    const history = [createMockEntry("1", "Hello world", Date.now())]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    const list = screen.getByRole("list")
    const scrollContainer = list.parentElement

    expect(scrollContainer).toHaveClass("overflow-y-auto")
    expect(scrollContainer).toHaveClass("max-h-80")
  })

  it("shows delete button for each entry on hover", () => {
    const history = [createMockEntry("1", "Hello world", Date.now())]

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    // Delete button should be in the DOM (hidden initially via CSS opacity-0)
    const deleteButton = screen.getByRole("button", { name: /delete "Hello world"/i })
    expect(deleteButton).toBeInTheDocument()
  })

  it("calls onRemoveEntry when clicking delete button", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]
    const onRemoveEntry = vi.fn()

    render(
      <HistoryView
        history={history}
        onSelectEntry={vi.fn()}
        onRemoveEntry={onRemoveEntry}
        onClearHistory={vi.fn()}
      />,
    )

    const deleteButton = screen.getByRole("button", { name: /delete "Hello world"/i })
    await user.click(deleteButton)

    expect(onRemoveEntry).toHaveBeenCalledWith("1")
  })

  it("does not call onSelectEntry when clicking delete button", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]
    const onSelectEntry = vi.fn()
    const onRemoveEntry = vi.fn()

    render(
      <HistoryView
        history={history}
        onSelectEntry={onSelectEntry}
        onRemoveEntry={onRemoveEntry}
        onClearHistory={vi.fn()}
      />,
    )

    const deleteButton = screen.getByRole("button", { name: /delete "Hello world"/i })
    await user.click(deleteButton)

    expect(onRemoveEntry).toHaveBeenCalled()
    expect(onSelectEntry).not.toHaveBeenCalled()
  })
})
