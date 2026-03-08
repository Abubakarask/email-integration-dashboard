<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GmailIntegrationController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\ThreadController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\AttachmentController;

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

    // Sync
    Route::post('/gmail/sync',   [SyncController::class, 'sync']);
    Route::post('/gmail/resync', [SyncController::class, 'resync']);

    // Threads
    Route::get('/threads',      [ThreadController::class, 'index']);
    Route::get('/threads/{id}', [ThreadController::class, 'show']);

    // Reply
    Route::post('/threads/{id}/reply', [MessageController::class, 'reply']);

    // Attachment download
    Route::get('/attachments/{messageId}/{attachmentId}', [AttachmentController::class, 'download']);
});

// Option B — use your custom middleware instead
// Route::middleware('bearer.auth')->group(function () {
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/me',      [AuthController::class, 'me']);
// });
