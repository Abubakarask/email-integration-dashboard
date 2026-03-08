<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GmailIntegrationController;

// ── Public routes (no token) ──────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Public routes (Google redirect directly hits this) ────
Route::get('/gmail/callback', [GmailIntegrationController::class, 'callback']);

// ── Protected routes (Bearer token required) ─────────────
// Option A — use Sanctum's built-in middleware (recommended)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Gmail Integration endpoints
    Route::get('/gmail/connect',      [GmailIntegrationController::class, 'connect']);
    Route::get('/gmail/status',       [GmailIntegrationController::class, 'status']);
    Route::delete('/gmail/disconnect',[GmailIntegrationController::class, 'disconnect']);

    // All other protected routes go here
    // Route::get('/threads', [...]);
    // Route::post('/sync',   [...]);
});

// Option B — use your custom middleware instead
// Route::middleware('bearer.auth')->group(function () {
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/me',      [AuthController::class, 'me']);
// });
