import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconLogOut,
  IconPencil,
  IconPlus,
  IconTrash,
} from '../components/icons'
import { CLUBS } from '../constants/clubs'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { clearToken } from '../auth/storage'
import { mondayOfWeekContaining, shiftWeek } from '../lib/dates'
import {
  endTimesAfter,
  formatClockPart,
  formatTimeRange,
  formatWeekLabel,
  ROOM_HALF_HOUR_TIMES,
  toMinutes,
} from '../lib/timeDisplay'
import type { Booking } from '../types'

function flattenError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { message?: string; errors?: Record<string, string[]> }
    if (data.errors) return Object.values(data.errors).flat().join(' ')
    if (typeof data.message === 'string') return data.message
  }
  if (err instanceof Error) return err.message
  return 'Request failed.'
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(() => mondayOfWeekContaining(new Date().toISOString().slice(0, 10)))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editBooking, setEditBooking] = useState<Booking | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await api.get<{ bookings: Booking[] }>('/admin/bookings', { params: { week: weekStart } })
      setBookings(res.data.bookings)
    } catch (e) {
      setErr(flattenError(e))
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    void load()
  }, [load])

  async function logout() {
    try {
      await api.post('/admin/logout')
    } catch {
      /* ignore */
    }
    clearToken()
    navigate('/admin-login', { replace: true })
  }

  async function remove(id: number) {
    if (!confirm('Delete this booking?')) return
    try {
      await api.delete(`/admin/bookings/${id}`)
      void load()
    } catch (e) {
      alert(flattenError(e))
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-semibold">Admin · Bookings</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="text-sm text-violet-600 hover:underline">
              View public schedule
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              <IconLogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
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
            <span className="text-sm font-medium">Week of {formatWeekLabel(weekStart)}</span>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <IconPlus className="h-4 w-4" />
            Add booking
          </button>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 font-medium">Date &amp; time</th>
                  <th className="px-3 py-2 font-medium">Club</th>
                  <th className="px-3 py-2 font-medium">Activity</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Locked</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                      No bookings this week.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-b border-zinc-100">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium">{b.booking_date}</div>
                        <div className="text-xs text-zinc-500">
                          {formatTimeRange(b.start_time, b.end_time)}
                        </div>
                      </td>
                      <td className="px-3 py-2">{b.club_name}</td>
                      <td className="px-3 py-2">{b.activity_name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            b.status === 'approved'
                              ? 'bg-violet-100 text-violet-800'
                              : b.status === 'pending'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{b.is_locked ? 'Yes' : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditBooking(b)}
                            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-100"
                            aria-label="Edit"
                          >
                            <IconPencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(b.id)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {addOpen && (
        <BookingFormModal
          title="Add booking"
          weekStart={weekStart}
          clubs={CLUBS}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false)
            void load()
          }}
        />
      )}

      {editBooking && (
        <BookingFormModal
          title="Edit booking"
          weekStart={weekStart}
          clubs={CLUBS}
          initial={editBooking}
          onClose={() => setEditBooking(null)}
          onSaved={() => {
            setEditBooking(null)
            void load()
          }}
        />
      )}
    </div>
  )
}

type ModalProps = {
  title: string
  weekStart: string
  clubs: string[]
  initial?: Booking
  onClose: () => void
  onSaved: () => void
}

function BookingFormModal({ title, weekStart, clubs, initial, onClose, onSaved }: ModalProps) {
  const isEdit = Boolean(initial)
  const [bookingDate, setBookingDate] = useState(initial?.booking_date ?? weekStart)
  const [club, setClub] = useState(initial?.club_name ?? clubs[0])
  const [activity, setActivity] = useState(initial?.activity_name ?? '')
  const [customStart, setCustomStart] = useState(() => initial?.start_time.slice(0, 5) ?? '09:00')
  const [customEnd, setCustomEnd] = useState(() => initial?.end_time.slice(0, 5) ?? '11:00')
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(initial?.status ?? 'approved')
  const [isLocked, setIsLocked] = useState(initial?.is_locked ?? false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const customEndOptions = useMemo(() => endTimesAfter(customStart), [customStart])

  useEffect(() => {
    if (!customEndOptions.includes(customEnd)) {
      setCustomEnd(customEndOptions[0] ?? '18:00')
    }
  }, [customStart, customEndOptions, customEnd])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitErr(null)
    setSubmitting(true)
    try {
      if (toMinutes(customEnd) <= toMinutes(customStart)) {
        setSubmitErr('End time must be after start.')
        return
      }
      if (isEdit && initial) {
        await api.patch(`/admin/bookings/${initial.id}`, {
          booking_date: bookingDate,
          club_name: club,
          activity_name: activity,
          status,
          is_locked: isLocked,
          start_time: customStart,
          end_time: customEnd,
        })
      } else {
        await api.post('/admin/bookings', {
          booking_date: bookingDate,
          club_name: club,
          activity_name: activity,
          repeat_weeks: repeatWeeks,
          status,
          is_locked: isLocked,
          start_time: customStart,
          end_time: customEnd,
        })
      }
      onSaved()
    } catch (error) {
      setSubmitErr(flattenError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
          <label className="block text-sm font-medium">
            Date
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Club
            <select
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {clubs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Activity
            <input
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <div>
            <span className="text-sm font-medium">Start and end</span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                aria-label="Start"
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
                aria-label="End"
              >
                {customEndOptions.map((t) => (
                  <option key={t} value={t}>
                    {formatClockPart(t)}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-zinc-500">08:00–18:00, no overlap with other bookings.</p>
          </div>

          {!isEdit && (
            <label className="block text-sm font-medium">
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
          )}

          <label className="block text-sm font-medium">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
            Locked (discourage changes)
          </label>

          {submitErr && <p className="text-sm text-red-600">{submitErr}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
