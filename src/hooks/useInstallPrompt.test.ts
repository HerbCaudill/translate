import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useInstallPrompt } from "./useInstallPrompt"

// Mock BeforeInstallPromptEvent
interface MockBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function createMockEvent(
  userChoice: "accepted" | "dismissed" = "accepted",
): MockBeforeInstallPromptEvent {
  const event = new Event("beforeinstallprompt") as MockBeforeInstallPromptEvent
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome: userChoice })
  return event
}

describe("useInstallPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("initially returns canInstall as false", () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
  })

  it("sets canInstall to true when beforeinstallprompt fires", () => {
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      window.dispatchEvent(createMockEvent())
    })

    expect(result.current.canInstall).toBe(true)
  })

  it("promptInstall calls the stored event's prompt method", async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const mockEvent = createMockEvent()

    act(() => {
      window.dispatchEvent(mockEvent)
    })

    await act(async () => {
      await result.current.promptInstall()
    })

    expect(mockEvent.prompt).toHaveBeenCalled()
  })

  it("sets canInstall to false after user accepts", async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const mockEvent = createMockEvent("accepted")

    act(() => {
      window.dispatchEvent(mockEvent)
    })

    expect(result.current.canInstall).toBe(true)

    await act(async () => {
      await result.current.promptInstall()
    })

    expect(result.current.canInstall).toBe(false)
  })

  it("sets canInstall to false after user dismisses", async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const mockEvent = createMockEvent("dismissed")

    act(() => {
      window.dispatchEvent(mockEvent)
    })

    expect(result.current.canInstall).toBe(true)

    await act(async () => {
      await result.current.promptInstall()
    })

    expect(result.current.canInstall).toBe(false)
  })

  it("promptInstall does nothing when no event is stored", async () => {
    const { result } = renderHook(() => useInstallPrompt())

    // Should not throw
    await act(async () => {
      await result.current.promptInstall()
    })

    expect(result.current.canInstall).toBe(false)
  })

  it("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")
    const { unmount } = renderHook(() => useInstallPrompt())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function))
  })

  it("sets canInstall to false when appinstalled fires", () => {
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      window.dispatchEvent(createMockEvent())
    })

    expect(result.current.canInstall).toBe(true)

    act(() => {
      window.dispatchEvent(new Event("appinstalled"))
    })

    expect(result.current.canInstall).toBe(false)
  })
})
