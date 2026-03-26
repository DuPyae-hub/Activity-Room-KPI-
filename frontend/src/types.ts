export type BookingStatus = 'pending' | 'approved' | 'rejected'

export type Booking = {
  id: number
  booking_date: string
  start_time: string
  end_time: string
  club_name: string
  activity_name: string
  status: BookingStatus
  is_locked: boolean
  slot_key: string | null
}

export type ScheduleDay = {
  date: string
  bookings: Booking[]
}

export type ScheduleResponse = {
  week_start: string
  clubs: string[]
  days: ScheduleDay[]
}
