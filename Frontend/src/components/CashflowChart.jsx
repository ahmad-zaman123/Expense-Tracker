import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Colours come from the page's own tokens, so the chart follows the light and dark themes.
const IN = "var(--in)"
const OUT = "var(--out)"

function CashflowChart({ data }) {
  return (
    <div role="img" aria-label="Income and expense for each of the last six months. The same figures are in the table below.">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--rule)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} stroke="var(--rule)" />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} width={64} stroke="var(--rule)" />
          <Tooltip
            cursor={{ fill: "var(--rule)", opacity: 0.35 }}
            contentStyle={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: 2 }}
          />
          <Legend />
          <Bar dataKey="income" name="In" fill={IN} radius={[1, 1, 0, 0]} />
          <Bar dataKey="expense" name="Out" fill={OUT} radius={[1, 1, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CashflowChart
