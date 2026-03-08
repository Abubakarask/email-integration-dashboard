<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;

class BearerTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Step 1 — Extract token from Authorization header
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'message' => 'Authorization token missing'
            ], 401);
        }

        // Step 2 — Strip "Bearer " prefix to get raw token
        $rawToken = substr($authHeader, 7);  // "Bearer " is 7 chars

        // Step 3 — Find token record in DB
        // Sanctum stores tokens as: {id}|{token_hash}
        // plainTextToken looks like "1|abc123xyz..."
        $tokenRecord = PersonalAccessToken::findToken($rawToken);

        if (!$tokenRecord) {
            return response()->json([
                'message' => 'Invalid or expired token'
            ], 401);
        }

        // Step 4 — Load the user attached to this token
        $user = $tokenRecord->tokenable;

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 401);
        }

        // Step 5 — Attach user to request so controllers can use $request->user()
        $request->setUserResolver(fn() => $user);

        return $next($request);
    }
}
