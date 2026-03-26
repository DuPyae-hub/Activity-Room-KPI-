/** Display rule: afternoon uses 12h-style hours (14:00 → 02:00); noon stays 12. */
export function formatClockPart(hm: string): string {
  const [hStr, m] = hm.split(':')
  const h = Number.parseInt(hStr, 10)
  if (Number.isNaN(h)) return hm
  if (h > 12) return `${String(h - 12).padStart(2, '0')}:${m}`
  if (h === 12) return `12:${m}`
  return `${String(h).padStart(2, '0')}:${m}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatClockPart(start)} – ${formatClockPart(end)}`
}

export function shortWeekday(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
  })
}

export function weekdayName(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
  })
}

export function formatWeekLabel(weekStartIso: string): string {
  const d = new Date(weekStartIso + 'T12:00:00')
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** 08:00 … 18:00 in 30-minute steps (room window). */
export const ROOM_HALF_HOUR_TIMES: string[] = (() => {
  const out: string[] = []
  for (let h = 8; h <= 18; h++) {
    for (const mm of [0, 30]) {
      if (h === 18 && mm > 0) break
      out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
    }
  }
  return out
})()

export function toMinutes(hm: string): number {
  const [h, m] = hm.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

/** End-time options: after `start`, not after 18:00. */
export function endTimesAfter(start: string): string[] {
  const s = toMinutes(start)
  return ROOM_HALF_HOUR_TIMES.filter((t) => {
    const e = toMinutes(t)
    return e > s && e <= toMinutes('18:00')
  })
}
