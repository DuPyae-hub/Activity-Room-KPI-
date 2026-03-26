<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingSlotService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PublicBookingController extends Controller
{
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
        ]);

        $bounds = $slots->parseAndValidateWindow($validated['start_time'], $validated['end_time']);

        if (! $bounds) {
            throw ValidationException::withMessages([
                'start_time' => ['Invalid times. Use 08:00–18:00, end after start, 30 min–8 hr duration.'],
            ]);
        }

        $repeatWeeks = (int) ($validated['repeat_weeks'] ?? 1);
        $baseDate = Carbon::parse($validated['booking_date'])->startOfDay();

        $dates = [];
        for ($i = 0; $i < $repeatWeeks; $i++) {
            $dates[] = $baseDate->copy()->addWeeks($i)->format('Y-m-d');
        }

        foreach ($dates as $date) {
            if ($slots->hasConflict($date, $bounds['start'], $bounds['end'])) {
                throw ValidationException::withMessages([
                    'start_time' => ["These times overlap another pending or approved booking on {$date}."],
                ]);
            }
        }

        $created = DB::transaction(function () use ($dates, $bounds, $validated) {
            $rows = [];
            foreach ($dates as $date) {
                $rows[] = Booking::create([
                    'booking_date' => $date,
                    'start_time' => $bounds['start'],
                    'end_time' => $bounds['end'],
                    'club_name' => $validated['club_name'],
                    'activity_name' => $validated['activity_name'],
                    'status' => 'pending',
                    'is_locked' => false,
                    'slot_key' => null,
                ]);
            }

            return $rows;
        });

        return response()->json([
            'bookings' => array_map(fn (Booking $b) => $b->toApiArray(), $created),
        ], 201);
    }
}
