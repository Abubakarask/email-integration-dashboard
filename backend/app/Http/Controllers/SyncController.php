<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGmailEmails;
use App\Models\GmailIntegration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SyncController extends Controller
{
    /**
     * Trigger email sync
     * POST /api/gmail/sync
     * Header: Authorization: Bearer {token}
     * Body: { "days": 30 }
     */
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        $user        = $request->user();
        $integration = GmailIntegration::where('user_id', $user->id)->first();

        if (!$integration || !$integration->isConnected()) {
            return response()->json([
                'message' => 'Gmail is not connected. Please connect your account first.',
            ], 400);
        }

        // Save how many days user chose — stored for reference / re-sync
        $integration->update(['synced_days' => $request->days]);

        // Dispatch background job — returns immediately, job runs in queue worker
        SyncGmailEmails::dispatch($integration->id, $request->days);

        return response()->json([
            'message' => "Sync started. Fetching last {$request->days} days of emails.",
        ]);
    }

    /**
     * Re-sync (incremental) — uses historyId
     * POST /api/gmail/resync
     * Header: Authorization: Bearer {token}
     */
    public function resync(Request $request): JsonResponse
    {
        $user        = $request->user();
        $integration = GmailIntegration::where('user_id', $user->id)->first();

        if (!$integration || !$integration->isConnected()) {
            return response()->json(['message' => 'Gmail not connected.'], 400);
        }

        // Dispatch with days=null signals incremental sync inside the job
        SyncGmailEmails::dispatch($integration->id, null);

        return response()->json(['message' => 'Incremental re-sync started.']);
    }

    /**
     * Get the current background synchronization status
     * GET /api/gmail/sync-status
     * Header: Authorization: Bearer {token}
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $integration = GmailIntegration::where('user_id', $user->id)->first();

        if (!$integration) {
            return response()->json([
                'status' => 'not_connected',
                'message' => 'No integration found.',
            ]);
        }

        return response()->json([
            'status' => $integration->sync_status, // not_started, in_progress, completed, failed
            'message' => $integration->sync_message,
        ]);
    }
}
