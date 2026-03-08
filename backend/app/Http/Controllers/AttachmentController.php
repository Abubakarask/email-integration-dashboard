<?php

namespace App\Http\Controllers;

use App\Models\EmailMessage;
use App\Models\GmailIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    /**
     * Download an attachment (lazy fetch from Gmail API)
     * GET /api/attachments/{messageId}/{attachmentId}
     * Header: Authorization: Bearer {token}
     *
     * messageId    = your DB email_messages.id (not gmail_message_id)
     * attachmentId = gmail_attachment_id from attachments JSON
     */
    public function download(Request $request, int $messageId, string $attachmentId)
    {
        $user        = $request->user();
        $integration = GmailIntegration::where('user_id', $user->id)->first();

        if (!$integration) {
            return response()->json(['message' => 'Gmail not connected.'], 400);
        }

        // Load message — verify it belongs to this user
        $message = EmailMessage::whereHas('thread', function ($q) use ($integration) {
                $q->where('integration_id', $integration->id);
            })
            ->find($messageId);

        if (!$message) {
            return response()->json(['message' => 'Message not found.'], 404);
        }

        // Find the attachment metadata in the JSON column
        $attachment = collect($message->attachments ?? [])
            ->firstWhere('attachmentId', $attachmentId);

        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found.'], 404);
        }

        $filename    = $attachment['filename'];
        $storagePath = "attachments/{$messageId}/{$attachmentId}/{$filename}";

        // If already cached, serve from storage
        if (Storage::exists($storagePath)) {
            return Storage::download($storagePath, $filename);
        }

        // Fetch from Gmail API
        $accessToken = $integration->getFreshAccessToken();
        $response    = Http::withToken($accessToken)
            ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$message->gmail_message_id}/attachments/{$attachmentId}");

        if (!$response->ok()) {
            return response()->json(['message' => 'Failed to fetch attachment from Gmail.'], 502);
        }

        // Decode base64url → binary
        $fileData = base64_decode(strtr($response->json('data'), '-_', '+/'));

        // Cache to storage
        Storage::put($storagePath, $fileData);

        return response($fileData, 200, [
            'Content-Type'        => 'application/octet-stream',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
