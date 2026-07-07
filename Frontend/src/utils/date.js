export function todayISODate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return now.getFullYear() + "-" + month + "-" + day
}

export function currentMonth() {
  const now = new Date()
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")
}

// Inclusive [from, to] date strings spanning the last `count` months up to today.
export function recentMonthsRange(count) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (count - 1), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const pad = (value) => String(value).padStart(2, "0")
  return {
    from: start.getFullYear() + "-" + pad(start.getMonth() + 1) + "-01",
    to: now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(lastDay),
  }
}
