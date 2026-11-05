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
import { formatMonth } from "../utils/date"
import { formatMoney } from "../utils/format"

// Colours come from the page's own tokens, so the chart follows the light and dark themes.
const IN = "var(--in)"
const OUT = "var(--out)"

// Spelled out so every browser shows "Sep", matching the dates elsewhere on the site.
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function shortMonth(yearMonth) {
  const month = Number(String(yearMonth).split("-")[1])
  return SHORT_MONTHS[month - 1] || yearMonth
}

const axisAmount = (value) => Number(value).toLocaleString("en-PK")

function CashflowChart({ data }) {
  return (
    <div role="img" aria-label="Income and expense for each of the last six months. The same figures are in the table below.">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--rule)" vertical={false} />
          <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 12, fill: "var(--muted)" }} stroke="var(--rule)" />
          <YAxis tickFormatter={axisAmount} tick={{ fontSize: 12, fill: "var(--muted)" }} width={72} stroke="var(--rule)" />
          <Tooltip
            cursor={{ fill: "var(--rule)", opacity: 0.35 }}
            formatter={(value) => formatMoney(value)}
            labelFormatter={formatMonth}
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
