import type Anthropic from "@anthropic-ai/sdk"

export const getRetryAfterMs = (
  error: InstanceType<typeof Anthropic.APIError>,
): number | undefined => {
  const headers = error.headers as Headers | undefined
  const retryAfter = headers?.get("retry-after")
  if (!retryAfter) return undefined

  // retry-after can be seconds (number) or HTTP-date
  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) {
    return seconds * 1000
  }

  // Try parsing as HTTP-date
  const date = Date.parse(retryAfter)
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now())
  }

  return undefined
}
