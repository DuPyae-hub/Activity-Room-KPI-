<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'booking_date',
        'start_time',
        'end_time',
        'club_name',
        'activity_name',
        'status',
        'is_locked',
        'slot_key',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'is_locked' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'approved']);
    }

    /**
     * @return array<string, mixed>
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'booking_date' => $this->booking_date->format('Y-m-d'),
            'start_time' => substr((string) $this->start_time, 0, 5),
            'end_time' => substr((string) $this->end_time, 0, 5),
            'club_name' => $this->club_name,
            'activity_name' => $this->activity_name,
            'status' => $this->status,
            'is_locked' => $this->is_locked,
            'slot_key' => $this->slot_key,
        ];
    }
}
