import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TranslateInput } from "./TranslateInput"

describe("TranslateInput", () => {
  it("renders an input field", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("renders a submit button", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("displays placeholder text", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()
  })

  it("has autofocus by default", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByRole("textbox")).toHaveFocus()
  })

  it("displays the current value", () => {
    render(<TranslateInput value="Hello world" onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByRole("textbox")).toHaveValue("Hello world")
  })

  it("calls onChange when text is entered", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TranslateInput value="" onChange={onChange} onSubmit={() => {}} />)

    await user.type(screen.getByRole("textbox"), "Test")
    expect(onChange).toHaveBeenCalledTimes(4)
    expect(onChange).toHaveBeenLastCalledWith("t")
  })

  it("can be disabled", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("accepts custom placeholder", () => {
    render(
      <TranslateInput
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder="Custom placeholder"
      />,
    )
    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument()
  })

  it("calls onEscape when Escape key is pressed", async () => {
    const user = userEvent.setup()
    const onEscape = vi.fn()
    render(
      <TranslateInput
        value="Some text"
        onChange={() => {}}
        onSubmit={() => {}}
        onEscape={onEscape}
      />,
    )

    await user.keyboard("{Escape}")
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it("does not crash when Escape is pressed without onEscape handler", async () => {
    const user = userEvent.setup()
    render(<TranslateInput value="Some text" onChange={() => {}} onSubmit={() => {}} />)

    // Should not throw
    await user.keyboard("{Escape}")
  })

  it("calls onSubmit when Enter key is pressed with text", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TranslateInput value="Hello" onChange={() => {}} onSubmit={onSubmit} />)

    await user.keyboard("{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("does not call onSubmit when Enter key is pressed with empty text", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TranslateInput value="" onChange={() => {}} onSubmit={onSubmit} />)

    await user.keyboard("{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("calls onSubmit when submit button is clicked", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TranslateInput value="Hello" onChange={() => {}} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button"))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("disables submit button when value is empty", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("disables submit button when loading", () => {
    render(<TranslateInput value="Hello" onChange={() => {}} onSubmit={() => {}} loading />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("shows loading spinner in button when loading", () => {
    render(<TranslateInput value="Hello" onChange={() => {}} onSubmit={() => {}} loading />)
    const button = screen.getByRole("button")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })

  it("applies mono font to input field", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("font-mono")
  })

  it("removes focus ring from input field", () => {
    render(<TranslateInput value="" onChange={() => {}} onSubmit={() => {}} />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("focus-visible:ring-0")
  })
})
