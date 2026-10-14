import { useEffect } from "react"

const SUFFIX = "Expense Tracker"

/** Give each screen its own browser-tab title, e.g. "Budgets — Expense Tracker". */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? title + " — " + SUFFIX : SUFFIX
    return () => {
      document.title = previous
    }
  }, [title])
}
