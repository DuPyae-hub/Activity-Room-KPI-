<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            return;
        }

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->date('booking_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('club_name');
            $table->string('activity_name');
            $table->string('status', 32)->default('pending');
            $table->boolean('is_locked')->default(false);
            $table->string('slot_key', 32)->nullable();
            $table->timestamps();

            $table->index(['booking_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
