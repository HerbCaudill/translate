import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TranslateInput } from "./TranslateInput"

describe("TranslateInput", () => {
  it("renders a textarea", () => {
    render(<TranslateInput value="" onChange={() => {}} />)
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("displays placeholder text", () => {
    render(<TranslateInput value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText(/enter text to translate/i)).toBeInTheDocument()
  })

  it("has autofocus by default", () => {
    render(<TranslateInput value="" onChange={() => {}} />)
    expect(screen.getByRole("textbox")).toHaveFocus()
  })

  it("displays the current value", () => {
    render(<TranslateInput value="Hello world" onChange={() => {}} />)
    expect(screen.getByRole("textbox")).toHaveValue("Hello world")
  })

  it("calls onChange when text is entered", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TranslateInput value="" onChange={onChange} />)

    await user.type(screen.getByRole("textbox"), "Test")
    expect(onChange).toHaveBeenCalledTimes(4)
    expect(onChange).toHaveBeenLastCalledWith("t")
  })

  it("can be disabled", () => {
    render(<TranslateInput value="" onChange={() => {}} disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("accepts custom placeholder", () => {
    render(<TranslateInput value="" onChange={() => {}} placeholder="Custom placeholder" />)
    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument()
  })
})
