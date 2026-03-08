<?php

namespace App\Http\Controllers;

use App\Models\GmailIntegration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GmailIntegrationController extends Controller
{
    // Google OAuth constants — mirrors your FastAPI constants
    const AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
    const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    const SCOPES    = 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

    /**
     * Step 1 — Generate auth URL with PKCE + state
     * GET /api/gmail/connect
     * Header: Authorization: Bearer {token}
     *
     * Mirrors your connect_google() in FastAPI
     */
    public function connect(Request $request): JsonResponse
    {
        $user = $request->user();

        // Generate PKCE pair — mirrors your generate_pkce_pair()
        $codeVerifier  = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

        // Random state for CSRF protection — mirrors your csrf_token
        $state = Str::random(40);

        // Store state + verifier temporarily on the integration record
        // (or create one if it doesn't exist yet)
        GmailIntegration::updateOrCreate(
            ['user_id' => $user->id],
            [
                'oauth_state'   => $state,
                'code_verifier' => $codeVerifier,
                'status'        => 'pending',
            ]
        );

        $authUrl = self::AUTH_URL . '?' . http_build_query([
            'response_type'         => 'code',
            'client_id'             => config('services.google.client_id'),
            'redirect_uri'          => config('services.google.redirect'),
            'scope'                 => self::SCOPES,
            'state'                 => $state,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
            'access_type'           => 'offline',
            'prompt'                => 'consent',   // forces refresh_token to be returned
        ]);

        return response()->json([
            'message'  => 'Google authorization URL generated',
            'auth_url' => $authUrl,
        ]);
    }

    /**
     * Step 2 — Handle OAuth callback from Google
     * GET /api/gmail/callback?code=...&state=...
     * No auth header needed — Google redirects here directly
     *
     * Mirrors your google_oauth_callback() in FastAPI
     */
    public function callback(Request $request)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $code        = $request->query('code');
        $state       = $request->query('state');

        // Validate code + state present
        if (!$code || !$state) {
            return redirect($frontendUrl . '/integrations?error=connection_failed');
        }

        // Find integration by state — mirrors your get_oauth_state()
        $integration = GmailIntegration::where('oauth_state', $state)->first();

        if (!$integration) {
            return redirect($frontendUrl . '/integrations?error=invalid_state');
        }

        // Exchange code for tokens using PKCE verifier
        $tokenResponse = Http::withoutVerifying()->asForm()->post(self::TOKEN_URL, [
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'client_id'     => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri'  => config('services.google.redirect'),
            'code_verifier' => $integration->code_verifier,  // PKCE
        ]);

        if (!$tokenResponse->ok()) {
            $integration->markError('Token exchange failed');
            return redirect($frontendUrl . '/integrations?error=token_exchange_failed');
        }

        $tokens       = $tokenResponse->json();
        $accessToken  = $tokens['access_token'] ?? null;
        $refreshToken = $tokens['refresh_token'] ?? null;  // only present if prompt=consent was used

        if (!$accessToken) {
            $integration->markError('No access token in response');
            return redirect($frontendUrl . '/integrations?error=connection_failed');
        }

        // Fetch Google user info — mirrors your verify_google_id_token() + decoded.get("email")
        $userInfo = Http::withoutVerifying()
                        ->withToken($accessToken)
                        ->get('https://www.googleapis.com/oauth2/v3/userinfo')
                        ->json();

        // Store tokens + metadata + clear PKCE state
        $integration->update([
            'access_token'     => $accessToken,
            'refresh_token'    => $refreshToken,
            'google_user_id'   => $userInfo['sub']   ?? null,
            'google_user_email'=> $userInfo['email'] ?? null,
            'oauth_state'      => null,    // clear — no longer needed
            'code_verifier'    => null,    // clear — no longer needed
            'status'           => 'active',
            'connected_at'     => now(),
            'error_message'    => null,
        ]);

        return redirect($frontendUrl . '/integrations?connected=true');
    }

    /**
     * Get current connection status
     * GET /api/gmail/status
     * Header: Authorization: Bearer {token}
     *
     * Mirrors your get_google_connection_status()
     */
    public function status(Request $request): JsonResponse
    {
        $integration = GmailIntegration::where('user_id', $request->user()->id)->first();

        if (!$integration || !$integration->isConnected()) {
            return response()->json([
                'status'  => 'not_connected',
                'message' => 'No Gmail integration found',
            ]);
        }

        return response()->json([
            'status'             => 'connected',
            'message'            => 'Gmail is connected',
            'google_user_email'  => $integration->google_user_email,
            'last_synced_at'     => $integration->last_synced_at,
            'synced_days'        => $integration->synced_days,
        ]);
    }

    /**
     * Disconnect Gmail
     * DELETE /api/gmail/disconnect
     * Header: Authorization: Bearer {token}
     *
     * Mirrors your disconnect_google()
     */
    public function disconnect(Request $request): JsonResponse
    {
        $integration = GmailIntegration::where('user_id', $request->user()->id)->first();

        if (!$integration) {
            return response()->json(['message' => 'Gmail was already disconnected']);
        }

        $integration->clearTokens();

        return response()->json(['message' => 'Gmail disconnected successfully']);
    }
}
