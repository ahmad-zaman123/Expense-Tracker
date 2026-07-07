// Turn an API error (with a parsed DRF body) into a single readable message.
export function formatError(error) {
  const data = error && error.data
  if (!data) {
    return "Something went wrong. Please try again."
  }
  if (typeof data === "string") {
    return data
  }
  if (data.detail) {
    return data.detail
  }

  const parts = []
  for (const [field, value] of Object.entries(data)) {
    const message = Array.isArray(value) ? value.join(" ") : String(value)
    parts.push(field === "non_field_errors" ? message : field + ": " + message)
  }
  return parts.join(" ") || "Something went wrong."
}
