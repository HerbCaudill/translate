import { describe, it, expect, vi, beforeEach } from "vitest"
import { logger, apiLogger } from "./logger"

describe("logger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    }
  })

  describe("logger.debug", () => {
    it("logs debug messages with correct format", () => {
      logger.debug("test", "debug message")
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[translate] [DEBUG] [test] debug message",
      )
    })

    it("logs debug messages with data", () => {
      logger.debug("test", "debug message", { foo: "bar" })
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[translate] [DEBUG] [test] debug message",
        { foo: "bar" },
      )
    })
  })

  describe("logger.info", () => {
    it("logs info messages with correct format", () => {
      logger.info("test", "info message")
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[translate] [INFO] [test] info message",
      )
    })

    it("logs info messages with data", () => {
      logger.info("test", "info message", { key: "value" })
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[translate] [INFO] [test] info message",
        { key: "value" },
      )
    })
  })

  describe("logger.warn", () => {
    it("logs warn messages with correct format", () => {
      logger.warn("test", "warning message")
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[translate] [WARN] [test] warning message",
      )
    })

    it("logs warn messages with data", () => {
      logger.warn("test", "warning message", { count: 5 })
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[translate] [WARN] [test] warning message",
        { count: 5 },
      )
    })
  })

  describe("logger.error", () => {
    it("logs error messages with correct format", () => {
      logger.error("test", "error message")
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[translate] [ERROR] [test] error message",
      )
    })

    it("logs error messages with data", () => {
      logger.error("test", "error message", { code: 500 })
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[translate] [ERROR] [test] error message",
        { code: 500 },
      )
    })
  })
})

describe("apiLogger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    }
  })

  describe("apiLogger.request", () => {
    it("logs request with endpoint and data", () => {
      apiLogger.request("messages.create", { model: "claude-3", textLength: 50 })
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[translate] [INFO] [api] Request: messages.create",
        { model: "claude-3", textLength: 50 },
      )
    })
  })

  describe("apiLogger.response", () => {
    it("logs response with endpoint and data", () => {
      apiLogger.response("messages.create", { optionsCount: 3 })
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[translate] [INFO] [api] Response: messages.create",
        { optionsCount: 3 },
      )
    })
  })

  describe("apiLogger.retry", () => {
    it("logs retry with attempt info", () => {
      apiLogger.retry("messages.create", 1, 3, 1000, "Rate limit exceeded")
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[translate] [WARN] [api] Retry: messages.create",
        {
          attempt: 1,
          maxRetries: 3,
          delayMs: 1000,
          reason: "Rate limit exceeded",
        },
      )
    })
  })

  describe("apiLogger.error", () => {
    it("logs error with endpoint and error message", () => {
      apiLogger.error("messages.create", "Connection failed")
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[translate] [ERROR] [api] Error: messages.create",
        { error: "Connection failed" },
      )
    })

    it("logs error with additional data", () => {
      apiLogger.error("messages.create", "Rate limited", { status: 429 })
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[translate] [ERROR] [api] Error: messages.create",
        { error: "Rate limited", status: 429 },
      )
    })
  })
})
