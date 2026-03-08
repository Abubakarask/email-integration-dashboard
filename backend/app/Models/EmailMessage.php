<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailMessage extends Model
{
    protected $fillable = [
        'email_thread_id',     // int — FK to email_threads
        'gmail_thread_id',     // string
        'gmail_message_id',    // string — unique Gmail message ID

        'from_name',           // string|null
        'from_email',          // string

        'to',                  // array — [{ name, email }]
        'cc',                  // array|null
        'bcc',                 // array|null

        'subject',             // string|null
        'body_html',           // string|null — decoded from base64url

        // [{ "attachmentId": "ANGjdJ...", "filename": "invoice.pdf" }]
        'attachments',         // array|null

        'message_id_header',   // string|null — Message-ID header value, used for In-Reply-To
        'in_reply_to',         // string|null

        'labels',              // array|null — ["INBOX", "UNREAD", "SENT"]
        'is_sent',             // bool
        'sent_at',             // timestamp|null
    ];

    protected $casts = [
        'to'          => 'array',
        'cc'          => 'array',
        'bcc'         => 'array',
        'attachments' => 'array',
        'labels'      => 'array',
        'is_sent'     => 'boolean',
        'sent_at'     => 'datetime',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(EmailThread::class, 'email_thread_id');
    }
}
