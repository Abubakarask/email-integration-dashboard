<?php

namespace App\Jobs;

use App\Models\EmailMessage;
use App\Models\EmailThread;
use App\Models\GmailIntegration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncGmailEmails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;      // retry up to 3 times on failure
    public int $timeout = 300;    // 5 minutes max

    public function __construct(
        private int  $integrationId,
        private ?int $days           // null = incremental sync
    ) {}

    public function handle(): void
    {
        $integration = GmailIntegration::find($this->integrationId);
        if (!$integration) return;

        // Get a fresh (possibly refreshed) access token
        $accessToken = $integration->getFreshAccessToken();
        if (!$accessToken) {
            Log::error("SyncGmailEmails: could not get access token for integration {$this->integrationId}");
            return;
        }

        $integration->update([
            'sync_status' => 'in_progress',
            'sync_message' => 'Syncing emails in background...',
        ]);

        try {
            Log::info("SyncGmailEmails: Starting sync for integration {$this->integrationId} (Days: " . ($this->days ?? 'incremental') . ")");
            if ($this->days === null && $integration->last_history_id) {
                // Incremental sync — only fetch changes since last sync
                Log::info("SyncGmailEmails [{$this->integrationId}]: Executing incremental sync using historyId: {$integration->last_history_id}");
                $this->incrementalSync($integration, $accessToken);
            } else {
                // Full sync — fetch all threads from date range
                Log::info("SyncGmailEmails [{$this->integrationId}]: Executing full sync for past {$this->days} days.");
                $this->fullSync($integration, $accessToken);
            }

            $integration->update([
                'last_synced_at' => now(),
                'sync_status' => 'completed',
                'sync_message' => 'Sync completed successfully',
            ]);
        } catch (\Exception $e) {
            $integration->markError('Sync failed: ' . $e->getMessage());
            $integration->update([
                'sync_status' => 'failed',
                'sync_message' => $e->getMessage(),
            ]);
            Log::error("SyncGmailEmails error: " . $e->getMessage());
        }
    }

    // ── FULL SYNC ──────────────────────────────────────────────────────────────

    private function fullSync(GmailIntegration $integration, string $token): void
    {
        $afterDate  = now()->subDays($this->days ?? 30)->format('Y/m/d');
        Log::info("SyncGmailEmails [{$integration->id}]: Fetching threads updated after {$afterDate}");
        $threadIds  = $this->fetchAllThreadIds($token, $afterDate);
        Log::info("SyncGmailEmails [{$integration->id}]: Found " . count($threadIds) . " threads to process.");
        $lastHistoryId = null;

        foreach ($threadIds as $threadId) {
            $threadData = $this->fetchThread($token, $threadId);
            if (!$threadData) continue;

            $this->upsertThread($integration, $threadData);

            // Track the highest historyId seen — save for incremental sync later
            if (isset($threadData['historyId'])) {
                $lastHistoryId = $threadData['historyId'];
            }
        }

        if ($lastHistoryId) {
            $integration->update(['last_history_id' => $lastHistoryId]);
        }
    }

    /**
     * Paginate through threads.list until no nextPageToken
     * Returns array of thread IDs
     */
    private function fetchAllThreadIds(string $token, string $afterDate): array
    {
        $ids       = [];
        $pageToken = null;

        do {
            $params = [
                'q'          => "after:{$afterDate}",
                'maxResults' => 500,
            ];
            if ($pageToken) $params['pageToken'] = $pageToken;

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get('https://gmail.googleapis.com/gmail/v1/users/me/threads', $params);

            if (!$response->ok()) break;

            $data = $response->json();

            foreach ($data['threads'] ?? [] as $thread) {
                $ids[] = $thread['id'];
            }

            $pageToken = $data['nextPageToken'] ?? null;

        } while ($pageToken);

        return $ids;
    }

    // ── INCREMENTAL SYNC ───────────────────────────────────────────────────────

    private function incrementalSync(GmailIntegration $integration, string $token): void
    {
        $response = Http::withoutVerifying()
            ->withToken($token)
            ->get('https://gmail.googleapis.com/gmail/v1/users/me/history', [
                'startHistoryId' => $integration->last_history_id,
                'historyTypes'   => 'messageAdded,messageDeleted',
                'maxResults'     => 500,
            ]);

        // 404 means historyId expired — fall back to full sync
        if ($response->status() === 404) {
            Log::warning("SyncGmailEmails [{$integration->id}]: HistoryId expired, falling back to full sync");
            $this->days = $integration->synced_days ?? 30;
            $this->fullSync($integration, $token);
            return;
        }

        if (!$response->ok()) {
            Log::error("SyncGmailEmails [{$integration->id}]: Incremental history fetch failed. Code: " . $response->status());
            return;
        }

        $data          = $response->json();
        $newHistoryId  = $data['historyId'] ?? null;
        $affectedThreads = [];

        foreach ($data['history'] ?? [] as $record) {
            // New messages — queue their thread IDs for re-fetch
            foreach ($record['messagesAdded'] ?? [] as $item) {
                $affectedThreads[$item['message']['threadId']] = true;
            }

            // Deleted messages — remove from DB
            foreach ($record['messagesDeleted'] ?? [] as $item) {
                EmailMessage::where('gmail_message_id', $item['message']['id'])->delete();
            }
        }

        // Re-fetch and upsert affected threads
        foreach (array_keys($affectedThreads) as $threadId) {
            $threadData = $this->fetchThread($token, $threadId);
            if ($threadData) {
                $this->upsertThread($integration, $threadData);
            }
        }

        if ($newHistoryId) {
            $integration->update(['last_history_id' => $newHistoryId]);
        }
    }

    // ── THREAD FETCH ───────────────────────────────────────────────────────────

    private function fetchThread(string $token, string $threadId): ?array
    {
        $response = Http::withoutVerifying()
            ->withToken($token)
            ->get("https://gmail.googleapis.com/gmail/v1/users/me/threads/{$threadId}", [
                'format' => 'full',
            ]);

        return $response->ok() ? $response->json() : null;
    }

    // ── UPSERT THREAD + MESSAGES ───────────────────────────────────────────────

    private function upsertThread(GmailIntegration $integration, array $data): void
    {
        $messages    = $data['messages'] ?? [];
        if (empty($messages)) return;

        $firstMsg    = $messages[0];
        $lastMsg     = end($messages);
        $firstHeaders = $this->indexHeaders($firstMsg['payload']['headers'] ?? []);
        $lastHeaders  = $this->indexHeaders($lastMsg['payload']['headers'] ?? []);

        // Collect all participant emails across all messages
        $participants = [];
        foreach ($messages as $msg) {
            $h = $this->indexHeaders($msg['payload']['headers'] ?? []);
            $participants[] = $this->parseEmailAddress($h['from'] ?? '')['email'];
        }
        $participants = array_values(array_unique(array_filter($participants)));

        // Upsert the thread record
        $thread = EmailThread::updateOrCreate(
            ['gmail_thread_id' => $data['id']],
            [
                'integration_id'  => $integration->id,
                'subject'         => $firstHeaders['subject'] ?? null,
                'snippet'         => $lastMsg['snippet'] ?? null,
                'participants'    => $participants,
                'message_count'   => count($messages),
                'last_message_at' => isset($lastMsg['internalDate'])
                    ? \Carbon\Carbon::createFromTimestampMs($lastMsg['internalDate'])
                    : null,
            ]
        );

        // Classify thread priority
        $priority = $this->classifyThread($thread, $messages);
        $thread->update(['priority' => $priority]);

        // Upsert each message in the thread
        foreach ($messages as $msg) {
            $this->upsertMessage($thread, $msg);
        }
    }

    private function upsertMessage(EmailThread $thread, array $msg): void
    {
        $headers     = $this->indexHeaders($msg['payload']['headers'] ?? []);
        $labelIds    = $msg['labelIds'] ?? [];

        // Parse From: "Alice Smith <alice@gmail.com>"
        $from        = $this->parseEmailAddress($headers['from'] ?? '');

        // Parse To/CC/BCC — can be comma-separated multiple addresses
        $to          = $this->parseMultipleAddresses($headers['to'] ?? '');
        $cc          = $this->parseMultipleAddresses($headers['cc'] ?? '');
        $bcc         = $this->parseMultipleAddresses($headers['bcc'] ?? '');

        // Walk MIME tree to extract HTML body + attachment metadata
        $bodyHtml    = null;
        $attachments = [];
        $this->parseMimeParts($msg['payload'], $bodyHtml, $attachments);

        // Fallback: if no HTML body found, check body.data directly (simple messages)
        if (!$bodyHtml && !empty($msg['payload']['body']['data'])) {
            $bodyHtml = $this->decodeBase64($msg['payload']['body']['data']);
            // If it's plain text, wrap in <pre> so it renders nicely
            if (($msg['payload']['mimeType'] ?? '') === 'text/plain') {
                $bodyHtml = '<pre style="white-space:pre-wrap;font-family:inherit">'
                          . htmlspecialchars($bodyHtml) . '</pre>';
            }
        }

        EmailMessage::updateOrCreate(
            ['gmail_message_id' => $msg['id']],
            [
                'email_thread_id'   => $thread->id,
                'gmail_thread_id'   => $msg['threadId'],
                'from_name'         => $from['name'],
                'from_email'        => $from['email'],
                'to'                => $to,
                'cc'                => $cc ?: null,
                'bcc'               => $bcc ?: null,
                'subject'           => $headers['subject'] ?? null,
                'body_html'         => $bodyHtml,
                'attachments'       => $attachments ?: null,
                'message_id_header' => $headers['message-id'] ?? null,
                'in_reply_to'       => $headers['in-reply-to'] ?? null,
                'labels'            => $labelIds,
                'is_sent'           => in_array('SENT', $labelIds),
                'sent_at'           => isset($msg['internalDate'])
                    ? \Carbon\Carbon::createFromTimestampMs($msg['internalDate'])
                    : null,
            ]
        );
    }

    // ── MIME PARSER ────────────────────────────────────────────────────────────

    /**
     * Recursively walk the MIME parts tree.
     * Sets $bodyHtml to the first text/html part found.
     * Appends attachment metadata to $attachments array.
     */
    private function parseMimeParts(array $part, ?string &$bodyHtml, array &$attachments): void
    {
        $mimeType = $part['mimeType'] ?? '';
        $filename = $part['filename'] ?? '';
        $bodyData = $part['body']['data'] ?? null;
        $attachId = $part['body']['attachmentId'] ?? null;

        // It's an attachment if it has a filename and an attachmentId
        if ($filename && $attachId) {
            // Only real attachments — skip inline images (Content-Disposition: inline)
            $disposition = '';
            foreach ($part['headers'] ?? [] as $h) {
                if (strtolower($h['name']) === 'content-disposition') {
                    $disposition = strtolower($h['value']);
                }
            }
            if (!str_contains($disposition, 'inline')) {
                $attachments[] = [
                    'attachmentId' => $attachId,
                    'filename'     => $filename,
                ];
            }
            return;
        }

        // It's the HTML body
        if ($mimeType === 'text/html' && $bodyData && !$bodyHtml) {
            $bodyHtml = $this->decodeBase64($bodyData);
            return;
        }

        // It's a plain text part and we have no HTML yet — use as fallback
        if ($mimeType === 'text/plain' && $bodyData && !$bodyHtml) {
            $plain    = $this->decodeBase64($bodyData);
            $bodyHtml = '<pre style="white-space:pre-wrap;font-family:inherit">'
                      . htmlspecialchars($plain) . '</pre>';
            // Don't return — keep recursing in case HTML part comes later in parts[]
        }

        // Recurse into nested parts (multipart/mixed, multipart/alternative, etc.)
        foreach ($part['parts'] ?? [] as $subPart) {
            $this->parseMimeParts($subPart, $bodyHtml, $attachments);
        }
    }

    // ── HELPERS ────────────────────────────────────────────────────────────────

    /**
     * Decode Gmail's base64url encoding to string
     */
    private function decodeBase64(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Turn headers array into key => value map (lowercased keys)
     * [{ name: "From", value: "Alice <alice@x.com>" }]
     * → ["from" => "Alice <alice@x.com>"]
     */
    private function indexHeaders(array $headers): array
    {
        $map = [];
        foreach ($headers as $h) {
            $map[strtolower($h['name'])] = $h['value'];
        }
        return $map;
    }

    /**
     * Parse "Alice Smith <alice@gmail.com>" → { name: "Alice Smith", email: "alice@gmail.com" }
     * Also handles bare "alice@gmail.com" with no display name
     */
    private function parseEmailAddress(string $raw): array
    {
        $raw = trim($raw);
        if (preg_match('/^(.*?)\s*<(.+?)>$/', $raw, $m)) {
            return ['name' => trim($m[1], '"'), 'email' => trim($m[2])];
        }
        return ['name' => null, 'email' => $raw];
    }

    /**
     * Parse comma-separated addresses into array of { name, email }
     * "Alice <a@x.com>, Bob <b@x.com>" → [{ name, email }, ...]
     */
    private function parseMultipleAddresses(string $raw): array
    {
        if (!$raw) return [];
        return array_map(
            fn($addr) => $this->parseEmailAddress(trim($addr)),
            explode(',', $raw)
        );
    }

    /**
     * Rule-based email priority classification.
     * No external API calls — all processing stays on server.
     * Privacy-safe for confidential business email content.
     *
     * @param EmailThread $thread
     * @param array $messages  raw messages array from Gmail API response
     * @return string  urgent | followup | resolved
     */
    private function classifyThread(EmailThread $thread, array $messages): string
    {
        try {
            $subject = strtolower($thread->subject ?? '');
            
            // Fix: $messages[0]['payload'] is an array. We need a string.
            // A simple fix for classification is to just use the snippet instead or specifically parse
            $firstBody = '';
            if (!empty($messages[0]['payload']['body']['data'])) {
                $firstBody = \base64_decode(strtr($messages[0]['payload']['body']['data'], '-_', '+/'));
            } else if (!empty($messages[0]['payload']['parts'][0]['body']['data'])) {
                // simple multipart fallback
                $firstBody = \base64_decode(strtr($messages[0]['payload']['parts'][0]['body']['data'], '-_', '+/'));
            }
            $firstBody = strip_tags($firstBody);
            
            $snippet = strtolower($thread->snippet ?? '');

            $text = $subject . ' ' . $snippet . ' ' . strtolower($firstBody);

            $urgentKeywords = [
                'urgent', 'urgently', 'asap', 'immediately', 'critical',
                'emergency', 'unacceptable', 'furious', 'angry', 'frustrated',
                'lawsuit', 'legal action', 'attorney', 'lawyer',
                'refund', 'cancel', 'cancellation', 'terminate', 'termination',
                'not working', 'broken', 'outage', 'down', 'failed', 'failure',
                'issue', 'problem', 'error', 'bug', 'crash',
                'overdue', 'past due', 'unpaid', 'missed deadline',
                'complaint', 'escalate', 'escalation', 'disappointed',
                'never received', 'still waiting', 'no response',
            ];

            $resolvedKeywords = [
                'thank you', 'thanks', 'thank you so much', 'many thanks',
                'resolved', 'resolution', 'fixed', 'sorted', 'all good',
                'appreciate', 'appreciated', 'grateful', 'gratitude',
                'perfect', 'great', 'excellent', 'wonderful', 'awesome',
                'closed', 'done', 'completed', 'confirmed', 'received',
                'no further', 'no longer', 'all set', 'good to go',
            ];

            // Check urgent first
            foreach ($urgentKeywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return 'urgent';
                }
            }

            // Then check resolved
            foreach ($resolvedKeywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return 'resolved';
                }
            }

            return 'followup';
        } catch (\Exception $e) {
            return 'followup';
        }
    }
}
