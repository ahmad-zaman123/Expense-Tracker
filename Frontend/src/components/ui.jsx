import { useId, useLayoutEffect, useRef, useState } from "react"

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  )
}

export function TextField({ label, type = "text", value, onChange, ...props }) {
  const [reveal, setReveal] = useState(false)
  const id = useId()
  const isPassword = type === "password"
  const inputType = isPassword && reveal ? "text" : type
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className={isPassword ? "input-wrap" : undefined}>
        <input id={id} className="input" type={inputType} value={value} onChange={onChange} {...props} />
        {isPassword && (
          <button
            type="button"
            className="reveal"
            onClick={() => setReveal((visible) => !visible)}
            aria-label={reveal ? "Hide password" : "Show password"}
            title={reveal ? "Hide password" : "Show password"}
          >
            <EyeIcon off={reveal} />
          </button>
        )}
      </div>
    </div>
  )
}

export function SelectField({ label, value, onChange, children, ...props }) {
  const id = useId()
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="select" value={value} onChange={onChange} {...props}>
        {children}
      </select>
    </div>
  )
}

export function Button({ children, className = "", ...props }) {
  return (
    <button className={"btn " + className} {...props}>
      {children}
    </button>
  )
}

export function Alert({ children }) {
  if (!children) {
    return null
  }
  return (
    <div className="alert" role="alert">
      {children}
    </div>
  )
}

/** A heading for a ledger page. */
export function PageHead({ title, children }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {children ? <p>{children}</p> : null}
    </div>
  )
}

/**
 * Wraps a wide table. It only becomes a keyboard stop (with a name) when the table actually
 * overflows, so people who cannot use a mouse can still scroll it.
 */
export function TableWrap({ label, style, children }) {
  const ref = useRef(null)
  const [scrolls, setScrolls] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [])
  const focusable = scrolls ? { tabIndex: 0, role: "region", "aria-label": label + " (scrolls sideways)" } : {}
  return (
    <div ref={ref} className="table-wrap" style={style} {...focusable}>
      {children}
    </div>
  )
}

/** A destructive action in two steps, so a stray click never removes a record. */
export function DeleteButton({ onConfirm, what = "entry", label = "Delete", confirmLabel }) {
  const [asking, setAsking] = useState(false)
  if (!asking) {
    return (
      <button className="text-btn" onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  }
  return (
    <span className="confirm">
      <button className="text-btn danger" onClick={onConfirm}>
        {confirmLabel || label + " this " + what}
      </button>
      <button className="text-btn" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  )
}

/** A section that stays folded until it is needed, so the ledger is what the page opens on. */
export function Fold({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details className="fold" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{title}</summary>
      <div className="fold-body">{children}</div>
    </details>
  )
}

/** Kept for compatibility: a plain section. */
export function Card({ children, className = "" }) {
  return <section className={className}>{children}</section>
}
