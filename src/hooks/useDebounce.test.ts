import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "./useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500))
    expect(result.current).toBe("initial")
  })

  it("does not update value before delay has passed", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    })

    rerender({ value: "updated", delay: 500 })

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(result.current).toBe("initial")
  })

  it("updates value after delay has passed", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    })

    rerender({ value: "updated", delay: 500 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe("updated")
  })

  it("resets timer when value changes before delay completes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    })

    rerender({ value: "first", delay: 500 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    rerender({ value: "second", delay: 500 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("initial")

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe("second")
  })

  it("uses default delay of 500ms", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "updated" })

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(result.current).toBe("initial")

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe("updated")
  })

  it("works with different types", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 42, delay: 500 },
    })

    expect(result.current).toBe(42)

    rerender({ value: 100, delay: 500 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe(100)
  })

  it("cleans up timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")

    const { unmount } = renderHook(() => useDebounce("test", 500))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
