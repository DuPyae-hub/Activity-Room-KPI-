<?php

use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\BookingController;
use App\Http\Controllers\Api\PublicBookingController;
use App\Http\Controllers\Api\PublicScheduleController;
use Illuminate\Support\Facades\Route;

Route::get('/schedule', [PublicScheduleController::class, 'show']);
Route::post('/bookings', [PublicBookingController::class, 'store']);

Route::post('/admin/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::patch('/bookings/{booking}', [BookingController::class, 'update']);
    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']);
});
