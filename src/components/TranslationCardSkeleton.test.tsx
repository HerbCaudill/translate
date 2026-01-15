import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TranslationCardSkeleton } from "./TranslationCardSkeleton"

describe("TranslationCardSkeleton", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<TranslationCardSkeleton />)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders language name when provided", () => {
    render(<TranslationCardSkeleton languageName="Spanish" />)
    expect(screen.getByText("Spanish")).toBeInTheDocument()
  })

  it("renders three translation option placeholders", () => {
    const { container } = render(<TranslationCardSkeleton />)
    // Each option has 2 skeletons (text + explanation)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBe(6)
  })
})
