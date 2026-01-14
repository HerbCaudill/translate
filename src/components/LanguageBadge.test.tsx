import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { LanguageBadge } from "./LanguageBadge"

describe("LanguageBadge", () => {
  it("renders the language name", () => {
    render(<LanguageBadge name="Spanish" />)
    expect(screen.getByText("Spanish")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<LanguageBadge name="French" className="test-class" />)
    const badge = screen.getByText("French")
    expect(badge).toHaveClass("test-class")
  })

  it("has correct base styling classes", () => {
    render(<LanguageBadge name="German" />)
    const badge = screen.getByText("German")
    expect(badge).toHaveClass("bg-primary")
    expect(badge).toHaveClass("text-primary-foreground")
    expect(badge).toHaveClass("rounded-full")
    expect(badge).toHaveClass("text-xs")
    expect(badge).toHaveClass("font-medium")
  })
})
