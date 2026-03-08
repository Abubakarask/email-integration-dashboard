<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// ── Public routes (no token) ──────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Protected routes (Bearer token required) ─────────────
// Option A — use Sanctum's built-in middleware (recommended)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // All other protected routes go here
    // Route::get('/threads', [...]);
    // Route::post('/sync',   [...]);
});

// Option B — use your custom middleware instead
// Route::middleware('bearer.auth')->group(function () {
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/me',      [AuthController::class, 'me']);
// });
