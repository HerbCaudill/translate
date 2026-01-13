import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCompletionCheck } from "./useCompletionCheck"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/anthropic", () => ({
  checkCompletion: vi.fn(),
}))

describe("useCompletionCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("returns idle status initially", () => {
    const { result } = renderHook(() => useCompletionCheck({ text: "", apiKey: "test-key" }))
    expect(result.current.status).toBe("idle")
  })

  it("returns idle when text is empty", async () => {
    const { result } = renderHook(() => useCompletionCheck({ text: "", apiKey: "test-key" }))

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.status).toBe("idle")
    expect(anthropic.checkCompletion).not.toHaveBeenCalled()
  })

  it("returns idle when apiKey is empty", async () => {
    const { result } = renderHook(() => useCompletionCheck({ text: "Hello", apiKey: "" }))

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.status).toBe("idle")
    expect(anthropic.checkCompletion).not.toHaveBeenCalled()
  })

  it("checks completion after debounce delay", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })

    const { result } = renderHook(() =>
      useCompletionCheck({ text: "Hello world", apiKey: "test-key" }),
    )

    expect(result.current.status).toBe("idle")

    // Advance timers and flush promises
    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.status).toBe("complete")
    expect(anthropic.checkCompletion).toHaveBeenCalledWith("test-key", "Hello world", undefined)
  })

  it("returns incomplete status when text is incomplete", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "incomplete" })

    const { result } = renderHook(() => useCompletionCheck({ text: "Hello", apiKey: "test-key" }))

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.status).toBe("incomplete")
  })

  it("returns error status when API fails", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({
      status: "error",
      error: "API error",
    })

    const { result } = renderHook(() =>
      useCompletionCheck({ text: "Hello world", apiKey: "test-key" }),
    )

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.status).toBe("error")
    expect(result.current.error).toBe("API error")
  })

  it("passes custom prompt to checkCompletion", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })

    renderHook(() =>
      useCompletionCheck({
        text: "Hello world",
        apiKey: "test-key",
        customPrompt: "Custom prompt",
      }),
    )

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(anthropic.checkCompletion).toHaveBeenCalledWith(
      "test-key",
      "Hello world",
      "Custom prompt",
    )
  })

  it("cancels previous check when text changes", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })

    const { rerender } = renderHook(
      ({ text }) => useCompletionCheck({ text, apiKey: "test-key" }),
      { initialProps: { text: "Hello" } },
    )

    // Advance part way
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    // Change text before debounce completes
    rerender({ text: "Hello world" })

    // Original timeout should have been cancelled, advance to trigger new one
    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    // Should only be called once with the new text
    expect(anthropic.checkCompletion).toHaveBeenCalledTimes(1)
    expect(anthropic.checkCompletion).toHaveBeenCalledWith("test-key", "Hello world", undefined)
  })

  it("allows custom debounce delay", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })

    renderHook(() =>
      useCompletionCheck({
        text: "Hello world",
        apiKey: "test-key",
        debounceMs: 1000,
      }),
    )

    // Default 500ms should not trigger
    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(anthropic.checkCompletion).not.toHaveBeenCalled()

    // Custom 1000ms should trigger
    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(anthropic.checkCompletion).toHaveBeenCalled()
  })

  it("resets to idle when text is cleared", async () => {
    vi.mocked(anthropic.checkCompletion).mockResolvedValue({ status: "complete" })

    const { result, rerender } = renderHook(
      ({ text }) => useCompletionCheck({ text, apiKey: "test-key" }),
      { initialProps: { text: "Hello world" } },
    )

    await act(async () => {
      vi.advanceTimersByTime(600)
      await Promise.resolve()
    })

    expect(result.current.status).toBe("complete")

    // Clear text
    rerender({ text: "" })

    expect(result.current.status).toBe("idle")
  })
})
