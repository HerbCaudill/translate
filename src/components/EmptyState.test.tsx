import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EmptyState } from "./EmptyState"

describe("EmptyState", () => {
  it("renders the heading text", () => {
    render(<EmptyState />)
    expect(screen.getByText("Start typing to translate")).toBeInTheDocument()
  })

  it("renders the description text", () => {
    render(<EmptyState />)
    expect(
      screen.getByText(/Enter text above and it will be translated automatically/),
    ).toBeInTheDocument()
  })

  it("renders the language icon", () => {
    render(<EmptyState />)
    const icon = document.querySelector("svg")
    expect(icon).toBeInTheDocument()
  })
})
