<?php

namespace App\Http\Controllers;

use App\Models\EmailMessage;
use App\Models\EmailThread;
use App\Models\GmailIntegration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class MessageController extends Controller
{
    /**
     * Reply to a thread
     * POST /api/threads/{id}/reply
     * Header: Authorization: Bearer {token}
     * Body: { "body": "<p>Your reply...</p>" }
     */
    public function reply(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'body' => 'required|string',
        ]);

        $user        = $request->user();
        $integration = GmailIntegration::where('user_id', $user->id)->first();

        if (!$integration || !$integration->isConnected()) {
            return response()->json(['message' => 'Gmail not connected.'], 400);
        }

        // Find thread — scoped to this user's integration
        $thread = EmailThread::where('id', $id)
            ->where('integration_id', $integration->id)
            ->first();

        if (!$thread) {
            return response()->json(['message' => 'Thread not found.'], 404);
        }

        // Get the last message in the thread for reply chain headers
        $lastMessage = EmailMessage::where('email_thread_id', $thread->id)
            ->orderByDesc('sent_at')
            ->first();

        if (!$lastMessage) {
            return response()->json(['message' => 'No messages in thread.'], 404);
        }

        // Determine reply-to address
        $replyTo = $lastMessage->from_email;

        // Build RFC 2822 email string
        // In-Reply-To + References keep Gmail in the same thread
        $subject     = str_starts_with($thread->subject ?? '', 'Re:')
                       ? $thread->subject
                       : 'Re: ' . ($thread->subject ?? '');

        $rawEmail    = implode("\r\n", [
            "From: {$integration->google_user_email}",
            "To: {$replyTo}",
            "Subject: {$subject}",
            "In-Reply-To: {$lastMessage->message_id_header}",
            "References: {$lastMessage->message_id_header}",
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            "",  // blank line separates headers from body
            $request->body,
        ]);

        // base64url encode the raw email
        $encoded = rtrim(strtr(base64_encode($rawEmail), '+/', '-_'), '=');

        // Get fresh token
        $accessToken = $integration->getFreshAccessToken();
        if (!$accessToken) {
            return response()->json(['message' => 'Could not refresh Gmail token.'], 500);
        }

        // Send via Gmail API — pass threadId to keep in same thread
        $response = Http::withoutVerifying()
            ->withToken($accessToken)
            ->post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', [
                'raw'      => $encoded,
                'threadId' => $thread->gmail_thread_id,
            ]);

        if (!$response->ok()) {
            return response()->json([
                'message' => 'Failed to send reply.',
                'detail'  => $response->json(),
            ], 502);
        }

        $sent = $response->json();

        // Store the sent message locally so it appears in the thread immediately
        EmailMessage::create([
            'email_thread_id'   => $thread->id,
            'gmail_thread_id'   => $thread->gmail_thread_id,
            'gmail_message_id'  => $sent['id'],
            'from_email'        => $integration->google_user_email,
            'from_name'         => null,
            'to'                => [['name' => null, 'email' => $replyTo]],
            'subject'           => $subject,
            'body_html'         => $request->body,
            'labels'            => ['SENT'],
            'is_sent'           => true,
            'sent_at'           => now(),
        ]);

        // Update thread snippet + message count
        $thread->increment('message_count');
        $thread->update([
            'snippet'         => strip_tags($request->body),
            'last_message_at' => now(),
        ]);

        return response()->json(['message' => 'Reply sent successfully.']);
    }
}
