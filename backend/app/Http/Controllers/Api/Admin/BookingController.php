<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingSlotService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request, BookingSlotService $slots): \Illuminate\Http\JsonResponse
    {
        $weekParam = $request->query('week', now()->format('Y-m-d'));
        $weekStart = $slots->weekStartMonday($weekParam);
        $weekEnd = \Carbon\Carbon::parse($weekStart)->addDays(6)->format('Y-m-d');

        // Use whereDate, not whereBetween with plain Y-m-d strings: on SQLite, DATE values are
        // often stored/compared as "Y-m-d 00:00:00", which sorts *after* "Y-m-d" and would
        // drop the week’s Sunday (inclusive end) from the range.
        $bookings = Booking::query()
            ->whereDate('booking_date', '>=', $weekStart)
            ->whereDate('booking_date', '<=', $weekEnd)
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'week_start' => $weekStart,
            'bookings' => $bookings->map(fn (Booking $b) => $b->toApiArray())->values(),
        ]);
    }

    public function store(Request $request, BookingSlotService $slots): \Illuminate\Http\JsonResponse
    {
        $clubs = config('booking.clubs');

        $validated = $request->validate([
            'booking_date' => ['required', 'date'],
            'club_name' => ['required', 'string', Rule::in($clubs)],
            'activity_name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'end_time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'repeat_weeks' => ['nullable', 'integer', 'min:1', 'max:8'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'approved', 'rejected'])],
            'is_locked' => ['nullable', 'boolean'],
        ]);

        $bounds = $slots->parseAndValidateWindow($validated['start_time'], $validated['end_time']);

        if (! $bounds) {
            throw ValidationException::withMessages([
                'start_time' => ['Invalid times. Use 08:00–18:00, end after start, 30 min–8 hr duration.'],
            ]);
        }

        $repeatWeeks = (int) ($validated['repeat_weeks'] ?? 1);
        $baseDate = \Carbon\Carbon::parse($validated['booking_date'])->startOfDay();
        $status = $validated['status'] ?? 'approved';
        $isLocked = (bool) ($validated['is_locked'] ?? false);

        $dates = [];
        for ($i = 0; $i < $repeatWeeks; $i++) {
            $dates[] = $baseDate->copy()->addWeeks($i)->format('Y-m-d');
        }

        foreach ($dates as $date) {
            if ($slots->hasConflict($date, $bounds['start'], $bounds['end'])) {
                throw ValidationException::withMessages([
                    'start_time' => ["This overlaps another pending or approved booking on {$date}."],
                ]);
            }
        }

        $created = \Illuminate\Support\Facades\DB::transaction(function () use ($dates, $bounds, $validated, $status, $isLocked) {
            $rows = [];
            foreach ($dates as $date) {
                $rows[] = Booking::create([
                    'booking_date' => $date,
                    'start_time' => $bounds['start'],
                    'end_time' => $bounds['end'],
                    'club_name' => $validated['club_name'],
                    'activity_name' => $validated['activity_name'],
                    'status' => $status,
                    'is_locked' => $isLocked,
                    'slot_key' => null,
                ]);
            }

            return $rows;
        });

        return response()->json([
            'bookings' => array_map(fn (Booking $b) => $b->toApiArray(), $created),
        ], 201);
    }

    public function update(Request $request, Booking $booking, BookingSlotService $slots): \Illuminate\Http\JsonResponse
    {
        $clubs = config('booking.clubs');

        $validated = $request->validate([
            'booking_date' => ['sometimes', 'date'],
            'club_name' => ['sometimes', 'string', Rule::in($clubs)],
            'activity_name' => ['sometimes', 'string', 'max:255'],
            'start_time' => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'end_time' => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'status' => ['sometimes', 'string', Rule::in(['pending', 'approved', 'rejected'])],
            'is_locked' => ['sometimes', 'boolean'],
        ]);

        $date = isset($validated['booking_date'])
            ? \Carbon\Carbon::parse($validated['booking_date'])->format('Y-m-d')
            : $booking->booking_date->format('Y-m-d');

        $timeChanging = array_key_exists('start_time', $validated)
            || array_key_exists('end_time', $validated)
            || isset($validated['booking_date']);

        if ($timeChanging) {
            $stIn = array_key_exists('start_time', $validated)
                ? $validated['start_time']
                : substr((string) $booking->start_time, 0, 5);
            $enIn = array_key_exists('end_time', $validated)
                ? $validated['end_time']
                : substr((string) $booking->end_time, 0, 5);

            $bounds = $slots->parseAndValidateWindow($stIn, $enIn);
            if (! $bounds) {
                throw ValidationException::withMessages([
                    'start_time' => ['Invalid times.'],
                ]);
            }

            if ($slots->hasConflict($date, $bounds['start'], $bounds['end'], $booking->id)) {
                throw ValidationException::withMessages([
                    'start_time' => ['This overlaps another pending or approved booking.'],
                ]);
            }

            $booking->booking_date = $date;
            $booking->start_time = $bounds['start'];
            $booking->end_time = $bounds['end'];
            $booking->slot_key = null;
        }

        if (isset($validated['club_name'])) {
            $booking->club_name = $validated['club_name'];
        }
        if (isset($validated['activity_name'])) {
            $booking->activity_name = $validated['activity_name'];
        }
        if (isset($validated['status'])) {
            $booking->status = $validated['status'];
        }
        if (array_key_exists('is_locked', $validated)) {
            $booking->is_locked = $validated['is_locked'];
        }

        if (in_array($booking->status, ['pending', 'approved'], true)) {
            $start = substr((string) $booking->start_time, 0, 5);
            $end = substr((string) $booking->end_time, 0, 5);
            $dateStr = $booking->booking_date instanceof \Carbon\Carbon
                ? $booking->booking_date->format('Y-m-d')
                : (string) $booking->booking_date;
            if ($slots->hasConflict($dateStr, $start, $end, $booking->id)) {
                throw ValidationException::withMessages([
                    'status' => ['Cannot save or approve: this booking overlaps another pending or approved one.'],
                ]);
            }
        }

        $booking->save();

        return response()->json(['booking' => $booking->fresh()->toApiArray()]);
    }

    public function destroy(Booking $booking): \Illuminate\Http\Response
    {
        $booking->delete();

        return response()->noContent();
    }
}
