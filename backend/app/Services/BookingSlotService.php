<?php

namespace App\Services;

use App\Models\Booking;
use Carbon\Carbon;

class BookingSlotService
{
    public const DURATION_MINUTES = 120;

    /**
     * @return list<array{key: string, start: string, end: string}>
     */
    public function fixedSlots(): array
    {
        return [
            ['key' => '08_10', 'start' => '08:00', 'end' => '10:00'],
            ['key' => '10_12', 'start' => '10:00', 'end' => '12:00'],
            ['key' => '12_14', 'start' => '12:00', 'end' => '14:00'],
            ['key' => '14_16', 'start' => '14:00', 'end' => '16:00'],
            ['key' => '16_18', 'start' => '16:00', 'end' => '18:00'],
        ];
    }

    public function slotKeys(): array
    {
        return array_column($this->fixedSlots(), 'key');
    }

    /**
     * @return array{start: string, end: string}|null
     */
    public function boundsFromSlotKey(string $key): ?array
    {
        foreach ($this->fixedSlots() as $slot) {
            if ($slot['key'] === $key) {
                return ['start' => $slot['start'], 'end' => $slot['end']];
            }
        }

        return null;
    }

    /**
     * @return array{start: string, end: string}|null
     */
    public function boundsFromCustomStart(string $time): ?array
    {
        $time = substr($time, 0, 5);
        if (! preg_match('/^\d{2}:\d{2}$/', $time)) {
            return null;
        }
        $start = Carbon::createFromFormat('H:i', $time);
        if (! $start) {
            return null;
        }
        $startMin = $this->toMinutes($time);
        $endMin = $startMin + self::DURATION_MINUTES;
        if ($startMin < $this->toMinutes('08:00') || $startMin > $this->toMinutes('16:00')) {
            return null;
        }
        if ($endMin > $this->toMinutes('18:00')) {
            return null;
        }

        return [
            'start' => $start->format('H:i'),
            'end' => $start->copy()->addMinutes(self::DURATION_MINUTES)->format('H:i'),
        ];
    }

    public function toMinutes(string $hms): int
    {
        $hms = substr($hms, 0, 5);
        [$h, $m] = array_map('intval', explode(':', $hms));

        return $h * 60 + $m;
    }

    /**
     * Validate a custom window (24h HH:MM). Room day 08:00–18:00, min 30 min, max 8 h.
     *
     * @return array{start: string, end: string}|null
     */
    public function parseAndValidateWindow(string $start, string $end): ?array
    {
        $start = substr($start, 0, 5);
        $end = substr($end, 0, 5);
        if (! preg_match('/^\d{2}:\d{2}$/', $start) || ! preg_match('/^\d{2}:\d{2}$/', $end)) {
            return null;
        }
        $sMin = $this->toMinutes($start);
        $eMin = $this->toMinutes($end);
        if ($sMin >= $eMin) {
            return null;
        }
        if ($sMin < $this->toMinutes('08:00') || $eMin > $this->toMinutes('18:00')) {
            return null;
        }
        $dur = $eMin - $sMin;
        if ($dur < 30 || $dur > 8 * 60) {
            return null;
        }

        return ['start' => $start, 'end' => $end];
    }

    public function rangesOverlap(string $startA, string $endA, string $startB, string $endB): bool
    {
        $s1 = $this->toMinutes($startA);
        $e1 = $this->toMinutes($endA);
        $s2 = $this->toMinutes($startB);
        $e2 = $this->toMinutes($endB);

        return $s1 < $e2 && $s2 < $e1;
    }

    public function bookingOverlapsWindow(Booking $b, string $date, string $winStart, string $winEnd): bool
    {
        if ($b->booking_date->format('Y-m-d') !== $date) {
            return false;
        }

        return $this->rangesOverlap(
            $b->start_time,
            $b->end_time,
            $winStart,
            $winEnd
        );
    }

    public function hasConflict(string $date, string $start, string $end, ?int $excludeId = null): bool
    {
        $q = Booking::active()
            ->whereDate('booking_date', $date);

        if ($excludeId) {
            $q->where('id', '!=', $excludeId);
        }

        foreach ($q->get() as $booking) {
            if ($this->rangesOverlap($start, $end, $booking->start_time, $booking->end_time)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Monday of the week for the given date (Y-m-d).
     */
    public function weekStartMonday(string $ymd): string
    {
        $d = Carbon::parse($ymd)->startOfDay();
        if ($d->dayOfWeek === Carbon::MONDAY) {
            return $d->format('Y-m-d');
        }
        $d->previous(Carbon::MONDAY);

        return $d->format('Y-m-d');
    }
}
