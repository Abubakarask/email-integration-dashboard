<?php

namespace App\Http\Controllers;

use App\Models\EmailThread;
use App\Models\EmailMessage;
use App\Models\GmailIntegration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard overview statistics
     * GET /api/dashboard
     * Header: Authorization: Bearer {token}
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Check if user has an active integration
        $integration = GmailIntegration::where('user_id', $user->id)->first();
        $isConnected = $integration && $integration->isConnected();

        if (!$integration) {
            return response()->json([
                'status' => 'not_connected',
                'stats' => [
                    'threads' => 0,
                    'messages' => 0,
                    'sent_messages' => 0,
                    'last_synced_at' => null,
                ]
            ]);
        }

        // 2. Compute aggregate counts
        $threadsCount = EmailThread::where('integration_id', $integration->id)->count();

        // Get thread ids for this integration to filter messages
        $threadIds = EmailThread::where('integration_id', $integration->id)->pluck('id');

        $messagesCount = EmailMessage::whereIn('email_thread_id', $threadIds)->count();
        $sentMessagesCount = EmailMessage::whereIn('email_thread_id', $threadIds)
                                          ->where('is_sent', true)
                                          ->count();

        return response()->json([
            'status' => $isConnected ? 'connected' : 'disconnected',
            'google_user_email' => $integration->google_user_email,
            'stats' => [
                'threads' => $threadsCount,
                'messages' => $messagesCount,
                'sent_messages' => $sentMessagesCount,
                'last_synced_at' => $integration->last_synced_at,
            ]
        ]);
    }
}
