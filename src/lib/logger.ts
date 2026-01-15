/**
 * Simple logger for API requests, responses, and retries.
 * Logs are written to the browser console with structured data.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

type LogEntry = {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: Record<string, unknown>
}

const LOG_PREFIX = "[translate]"

const formatEntry = (entry: LogEntry): string => {
  return `${LOG_PREFIX} [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`
}

const createLogEntry = (
  level: LogLevel,
  category: string,
  message: string,
  data?: Record<string, unknown>,
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  category,
  message,
  data,
})

const logWithData = (entry: LogEntry): void => {
  const formatted = formatEntry(entry)
  const consoleMethod = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log"

  if (entry.data && Object.keys(entry.data).length > 0) {
    console[consoleMethod](formatted, entry.data)
  } else {
    console[consoleMethod](formatted)
  }
}

export const logger = {
  debug: (category: string, message: string, data?: Record<string, unknown>) => {
    logWithData(createLogEntry("debug", category, message, data))
  },

  info: (category: string, message: string, data?: Record<string, unknown>) => {
    logWithData(createLogEntry("info", category, message, data))
  },

  warn: (category: string, message: string, data?: Record<string, unknown>) => {
    logWithData(createLogEntry("warn", category, message, data))
  },

  error: (category: string, message: string, data?: Record<string, unknown>) => {
    logWithData(createLogEntry("error", category, message, data))
  },
}

// Specialized API logger for consistent formatting
export const apiLogger = {
  request: (endpoint: string, data: Record<string, unknown>) => {
    logger.info("api", `Request: ${endpoint}`, data)
  },

  response: (endpoint: string, data: Record<string, unknown>) => {
    logger.info("api", `Response: ${endpoint}`, data)
  },

  retry: (endpoint: string, attempt: number, maxRetries: number, delayMs: number, reason: string) => {
    logger.warn("api", `Retry: ${endpoint}`, {
      attempt,
      maxRetries,
      delayMs,
      reason,
    })
  },

  error: (endpoint: string, error: string, data?: Record<string, unknown>) => {
    logger.error("api", `Error: ${endpoint}`, { error, ...data })
  },
}
