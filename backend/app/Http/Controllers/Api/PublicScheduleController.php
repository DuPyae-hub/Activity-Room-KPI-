<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingSlotService;
use Illuminate\Http\Request;

class PublicScheduleController extends Controller
{
    public function show(Request $request, BookingSlotService $slots): \Illuminate\Http\JsonResponse
    {
        $weekParam = $request->query('week', now()->format('Y-m-d'));
        $weekStart = $slots->weekStartMonday($weekParam);
        $clubs = config('booking.clubs');

        $days = [];
        $start = \Carbon\Carbon::parse($weekStart)->startOfDay();
        for ($d = 0; $d < 7; $d++) {
            $date = $start->copy()->addDays($d)->format('Y-m-d');
            $bookings = Booking::active()
                ->whereDate('booking_date', $date)
                ->orderBy('start_time')
                ->get()
                ->map(fn ($b) => $b->toApiArray())
                ->values()
                ->all();

            $days[] = [
                'date' => $date,
                'bookings' => $bookings,
            ];
        }

        return response()->json([
            'week_start' => $weekStart,
            'clubs' => $clubs,
            'days' => $days,
        ]);
    }
}
