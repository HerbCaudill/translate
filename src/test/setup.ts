import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Clear VITE_ANTHROPIC_API_KEY in tests to ensure predictable defaults
// This ensures tests don't inherit API keys from developer's .env files
vi.stubEnv("VITE_ANTHROPIC_API_KEY", "")

// Mock ResizeObserver for cmdk/radix components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock scrollIntoView for cmdk components
Element.prototype.scrollIntoView = () => {}
