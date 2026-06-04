<?php

use App\Http\Controllers\ProductionBatchController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ProductionBatchController::class, 'index'])->name('home');
Route::get('coupon-production', [ProductionBatchController::class, 'index'])->name('coupon-production.index');
Route::post('coupon-production', [ProductionBatchController::class, 'store'])->name('coupon-production.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
