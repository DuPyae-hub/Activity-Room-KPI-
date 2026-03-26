export function shiftWeek(weekStartYmd: string, deltaWeeks: number): string {
  const [y, m, d] = weekStartYmd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + deltaWeeks * 7)
  return dt.toISOString().slice(0, 10)
}

export function mondayOfWeekContaining(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = dt.getUTCDay()
  const mon = dow === 0 ? -6 : 1 - dow
  dt.setUTCDate(dt.getUTCDate() + mon)
  return dt.toISOString().slice(0, 10)
}
