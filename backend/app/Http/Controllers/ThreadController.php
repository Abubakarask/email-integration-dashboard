<?php

namespace App\Http\Controllers;

use App\Models\EmailThread;
use App\Models\GmailIntegration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ThreadController extends Controller
{
    /**
     * List all synced threads (paginated)
     * GET /api/threads?page=1&per_page=20
     * Header: Authorization: Bearer {token}
     */
    public function index(Request $request): JsonResponse
    {
        $integration = GmailIntegration::where('user_id', $request->user()->id)->first();

        if (!$integration) {
            return response()->json(['message' => 'Gmail not connected.'], 400);
        }

        $threads = EmailThread::where('integration_id', $integration->id)
            ->orderByDesc('last_message_at')
            ->paginate($request->get('per_page', 20));

        return response()->json($threads);
    }

    /**
     * Get single thread with all messages
     * GET /api/threads/{id}
     * Header: Authorization: Bearer {token}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $integration = GmailIntegration::where('user_id', $request->user()->id)->first();

        if (!$integration) {
            return response()->json(['message' => 'Gmail not connected.'], 400);
        }

        $thread = EmailThread::where('id', $id)
            ->where('integration_id', $integration->id)   // scoped to user's account
            ->with('messages')                             // eager load messages (ordered asc)
            ->first();

        if (!$thread) {
            return response()->json(['message' => 'Thread not found.'], 404);
        }

        return response()->json($thread);
    }
}
