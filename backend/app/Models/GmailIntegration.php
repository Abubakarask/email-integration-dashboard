<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class GmailIntegration extends Model
{
    protected $fillable = [
        'user_id',
        'status',                // string: pending|active|expired|revoked|error|disabled
        'access_token',          // string|null — encrypted in production
        'refresh_token',         // string|null — encrypted in production
        'google_user_id',        // string|null — Google's "sub" from id_token
        'google_user_email',     // string|null — e.g. alice@gmail.com
        'oauth_state',           // string|null — CSRF state param, cleared after callback
        'code_verifier',         // string|null — PKCE verifier, cleared after callback
        'last_history_id',       // string|null — for incremental Gmail sync
        'synced_days',           // int|null — days user chose to sync
        'last_synced_at',        // timestamp|null
        'error_message',         // string|null
        'last_error_at',         // timestamp|null
        'connected_at',          // timestamp|null
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
        'code_verifier',
        'oauth_state',
    ];

    protected $casts = [
        'last_synced_at'  => 'datetime',
        'last_error_at'   => 'datetime',
        'connected_at'    => 'datetime',
        'synced_days'     => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function threads(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EmailThread::class, 'integration_id');
    }

    // ── Status helpers — mirrors your is_connected() pattern ──

    public function isConnected(): bool
    {
        return $this->status === 'active'
            && $this->access_token !== null
            && $this->connected_at !== null;
    }

    public function markActive(): void
    {
        $this->status       = 'active';
        $this->connected_at = now();
        $this->error_message = null;
        $this->last_error_at = null;
        $this->save();
    }

    public function markError(string $message): void
    {
        $this->status        = 'error';
        $this->error_message = $message;
        $this->last_error_at = now();
        $this->save();
    }

    public function clearTokens(): void
    {
        $this->access_token  = null;
        $this->refresh_token = null;
        $this->status        = 'disabled';
        $this->connected_at  = null;
        $this->save();
    }

    public function storeTokens(string $accessToken, ?string $refreshToken): void
    {
        $this->access_token  = $accessToken;
        if ($refreshToken) {
            $this->refresh_token = $refreshToken;
        }
        $this->save();
    }

    // ── Token refresh — mirrors your get_fresh_access_token() ──

    public function getFreshAccessToken(): ?string
    {
        if (!$this->refresh_token) {
            return null;
        }

        $response = \Illuminate\Support\Facades\Http::withoutVerifying()->asForm()->post(
            'https://oauth2.googleapis.com/token',
            [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $this->refresh_token,
                'client_id'     => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
            ]
        );

        if (!$response->ok()) {
            $this->markError('Token refresh failed: ' . $response->status());
            return null;
        }

        $newToken = $response->json('access_token');
        $this->access_token = $newToken;
        $this->save();

        return $newToken;
    }
}
