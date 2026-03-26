<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (! Schema::hasColumn('bookings', 'is_locked')) {
                $table->boolean('is_locked')->default(false);
            }
            if (! Schema::hasColumn('bookings', 'slot_key')) {
                $table->string('slot_key', 32)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'slot_key')) {
                $table->dropColumn('slot_key');
            }
            if (Schema::hasColumn('bookings', 'is_locked')) {
                $table->dropColumn('is_locked');
            }
        });
    }
};
