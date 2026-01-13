import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TranslationResultsSkeleton } from "./TranslationResultsSkeleton"
import type { Language } from "@/types"

describe("TranslationResultsSkeleton", () => {
  const mockLanguages: Language[] = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ]

  it("renders skeleton cards for each language", () => {
    render(<TranslationResultsSkeleton languages={mockLanguages} />)
    expect(screen.getByText("Spanish")).toBeInTheDocument()
    expect(screen.getByText("French")).toBeInTheDocument()
    expect(screen.getByText("German")).toBeInTheDocument()
  })

  it("renders correct number of skeleton cards", () => {
    const { container } = render(<TranslationResultsSkeleton languages={mockLanguages} />)
    const cards = container.querySelectorAll("[data-slot='card']")
    expect(cards.length).toBe(3)
  })

  it("renders empty grid when no languages", () => {
    const { container } = render(<TranslationResultsSkeleton languages={[]} />)
    const cards = container.querySelectorAll("[data-slot='card']")
    expect(cards.length).toBe(0)
  })

  it("uses grid layout", () => {
    const { container } = render(<TranslationResultsSkeleton languages={mockLanguages} />)
    const grid = container.firstChild
    expect(grid).toHaveClass("grid")
  })
})
