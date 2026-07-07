export function formatMoney(value) {
  const number = Number(value || 0)
  return (
    "₨ " +
    number.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}
