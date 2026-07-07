export function TextField({ label, type = "text", value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        {...props}
      />
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
