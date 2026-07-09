import { useState } from "react"

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
      {off && (
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function TextField({ label, type = "text", value, onChange, ...props }) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && reveal ? "text" : type
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          className={
            "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none " +
            "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" +
            (isPassword ? " pr-11" : "")
          }
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((visible) => !visible)}
            aria-label={reveal ? "Hide password" : "Show password"}
            title={reveal ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-emerald-600"
          >
            <EyeIcon off={reveal} />
          </button>
        )}
      </div>
    </label>
  )
}

export function SelectField({ label, value, onChange, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={
        "rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition " +
        "hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  )
}

export function Alert({ children }) {
  if (!children) {
    return null
  }
  return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</div>
}

export function Card({ children, className = "" }) {
  return (
    <div className={"rounded-xl border border-slate-200 bg-white p-5 shadow-sm " + className}>
      {children}
    </div>
  )
}
