import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { HistoryDialog } from "./HistoryDialog"
import { HistoryEntry, Translation } from "@/types"

const createMockTranslation = (input: string): Translation => ({
  input,
  source: "en",
  results: [
    {
      language: { code: "es", name: "Spanish" },
      meanings: [
        { sense: "greeting", options: [{ text: "Hola", explanation: "Common greeting" }] },
      ],
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

describe("HistoryDialog", () => {
  it("renders history button", () => {
    render(<HistoryDialog history={[]} onSelectEntry={vi.fn()} onRemoveEntry={vi.fn()} />)

    expect(screen.getByRole("button", { name: "History" })).toBeInTheDocument()
  })

  it("opens dialog when clicking history button", async () => {
    const user = userEvent.setup()
    render(<HistoryDialog history={[]} onSelectEntry={vi.fn()} onRemoveEntry={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "History" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("History")).toBeInTheDocument()
  })

  it("displays history entries in dialog", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]

    render(<HistoryDialog history={history} onSelectEntry={vi.fn()} onRemoveEntry={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "History" }))

    expect(screen.getByText("Hello world")).toBeInTheDocument()
  })

  it("closes dialog and calls onSelectEntry when entry is clicked", async () => {
    const user = userEvent.setup()
    const history = [createMockEntry("1", "Hello world", Date.now())]
    const onSelectEntry = vi.fn()

    render(
      <HistoryDialog history={history} onSelectEntry={onSelectEntry} onRemoveEntry={vi.fn()} />,
    )

    await user.click(screen.getByRole("button", { name: "History" }))
    await user.click(screen.getByText("Hello world"))

    expect(onSelectEntry).toHaveBeenCalledWith(history[0])
    // Dialog should close after selection
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
