import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconLock,
  IconLogIn,
} from '../components/icons'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Booking, ScheduleResponse } from '../types'
import { mondayOfWeekContaining, shiftWeek } from '../lib/dates'
import {
  endTimesAfter,
  formatClockPart,
  formatTimeRange,
  formatWeekLabel,
  ROOM_HALF_HOUR_TIMES,
  weekdayName,
  toMinutes,
} from '../lib/timeDisplay'

function statusLabel(status: string | undefined): string {
  if (status === 'approved') return 'Approved'
  if (status === 'pending') return 'Pending'
  if (status === 'rejected') return 'Rejected'
  return status ?? ''
}

function flattenError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { message?: string; errors?: Record<string, string[]> }
    if (data.errors) {
      return Object.values(data.errors)
        .flat()
        .join(' ')
    }
    if (typeof data.message === 'string') {
      return data.message
    }
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong.'
}

function BookingCard({ b }: { b: Booking }) {
  return (
    <div
      className={`mb-2 rounded-lg border px-2.5 py-2 text-xs last:mb-0 ${
        b.status === 'approved'
          ? 'border-violet-200 bg-violet-50 text-violet-950'
          : b.status === 'pending'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-zinc-200 bg-zinc-100 text-zinc-600'
      }`}
    >
      <div className="font-semibold leading-tight">{b.club_name}</div>
      <div className="leading-tight text-zinc-700">{b.activity_name}</div>
      <div className="mt-0.5 font-medium leading-tight text-zinc-800">
        {formatTimeRange(b.start_time, b.end_time)}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
            b.status === 'approved'
              ? 'bg-violet-200/80 text-violet-900'
              : b.status === 'pending'
                ? 'bg-amber-200/80 text-amber-950'
                : 'bg-zinc-200 text-zinc-700'
          }`}
        >
          {statusLabel(b.status)}
        </span>
        {b.is_locked ? <IconLock className="h-3.5 w-3.5 text-zinc-500" aria-label="Locked" /> : null}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [weekStart, setWeekStart] = useState(() => mondayOfWeekContaining(new Date().toISOString().slice(0, 10)))
  const [data, setData] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState('')
  const [customStart, setCustomStart] = useState('09:00')
  const [customEnd, setCustomEnd] = useState('11:00')
  const [club, setClub] = useState('')
  const [activity, setActivity] = useState('')
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [formOk, setFormOk] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    try {
      const res = await api.get<ScheduleResponse>('/schedule', { params: { week: weekStart } })
      setData(res.data)
      setClub((prev) => prev || res.data.clubs[0] || '')
    } catch (e) {
      setLoadErr(flattenError(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    void load()
  }, [load])

  const customEndOptions = useMemo(() => endTimesAfter(customStart), [customStart])

  useEffect(() => {
    if (!customEndOptions.includes(customEnd)) {
      setCustomEnd(customEndOptions[0] ?? '18:00')
    }
  }, [customStart, customEndOptions, customEnd])

  function openRequest(date: string) {
    setModalDate(date)
    setCustomStart('09:00')
    const ends = endTimesAfter('09:00')
    setCustomEnd(ends.includes('11:00') ? '11:00' : ends[0] ?? '18:00')
    setRepeatWeeks(1)
    setFormErr(null)
    setFormOk(null)
    setModalOpen(true)
    if (data?.clubs.length) {
      setClub((prev) => prev || data.clubs[0])
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    setFormErr(null)
    setFormOk(null)
    setSubmitting(true)
    try {
      if (toMinutes(customEnd) <= toMinutes(customStart)) {
        setFormErr('End time must be after start time.')
        setSubmitting(false)
        return
      }
      await api.post('/bookings', {
        booking_date: modalDate,
        club_name: club,
        activity_name: activity,
        repeat_weeks: repeatWeeks,
        start_time: customStart,
        end_time: customEnd,
      })
      setFormOk('Request submitted. An admin will review it.')
      setModalOpen(false)
      setActivity('')
      void load()
    } catch (err) {
      setFormErr(flattenError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-8 w-8 text-violet-600" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Room schedule</h1>
              <p className="text-sm text-zinc-500">Strategy First International College</p>
            </div>
          </div>
          <Link
            to="/admin-login"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <IconLogIn className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
              className="rounded-lg border border-zinc-200 bg-white p-2 hover:bg-zinc-50"
              aria-label="Previous week"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
              className="rounded-lg border border-zinc-200 bg-white p-2 hover:bg-zinc-50"
              aria-label="Next week"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-zinc-700">
              Week of {formatWeekLabel(weekStart)}
            </span>
          </div>
        </div>

        {loadErr && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadErr}
          </div>
        )}

        {loading && <p className="text-sm text-zinc-500">Loading schedule…</p>}

        {data && !loading && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {data.days.map((day) => (
                    <th key={day.date} className="px-2 py-3 font-medium text-zinc-700">
                      <div>{weekdayName(day.date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100 align-top">
                  {data.days.map((day) => (
                    <td key={day.date} className="min-h-[120px] p-2 align-top">
                      <div className="flex min-h-[100px] flex-col gap-2">
                        <div className="flex-1">
                          {day.bookings.length === 0 ? (
                            <p className="text-xs text-zinc-400">No bookings</p>
                          ) : (
                            day.bookings.map((b) => <BookingCard key={b.id} b={b} />)
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openRequest(day.date)}
                          className="w-full rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 py-2 text-xs font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-800"
                        >
                          Request
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {formOk && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {formOk}
          </div>
        )}
      </main>

      {modalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Request booking</h2>
            <p className="mt-1 text-sm text-zinc-500">{modalDate}</p>

            <form onSubmit={submitRequest} className="mt-4 space-y-4">
              <div>
                <span className="text-sm font-medium text-zinc-700">Start and end</span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    aria-label="Start time"
                  >
                    {ROOM_HALF_HOUR_TIMES.filter((t) => toMinutes(t) < toMinutes('18:00')).map((t) => (
                      <option key={t} value={t}>
                        {formatClockPart(t)}
                      </option>
                    ))}
                  </select>
                  <span className="text-zinc-500">to</span>
                  <select
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    aria-label="End time"
                  >
                    {customEndOptions.map((t) => (
                      <option key={t} value={t}>
                        {formatClockPart(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-zinc-500">08:00–18:00, no overlap with existing bookings.</p>
              </div>

              <label className="block text-sm font-medium text-zinc-700">
                Club
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                  required
                >
                  {data.clubs.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-zinc-700">
                Activity
                <input
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="e.g. Weekly meeting"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-zinc-700">
                Repeat (weeks)
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={repeatWeeks}
                  onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>

              {formErr && <p className="text-sm text-red-600">{formErr}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
