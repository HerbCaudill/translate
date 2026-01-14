import "@testing-library/jest-dom/vitest"

// Mock ResizeObserver for cmdk/radix components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock scrollIntoView for cmdk components
Element.prototype.scrollIntoView = () => {}
