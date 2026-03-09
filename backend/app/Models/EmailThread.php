<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailThread extends Model
{
    protected $fillable = [
        'integration_id',     // int — FK to gmail_integrations
        'gmail_thread_id',    // string — Gmail's thread ID
        'subject',            // string|null
        'snippet',            // string|null — latest message preview for list UI
        'participants',       // array — ["alice@gmail.com", "bob@co.com"]
        'message_count',      // int
        'last_message_at',    // timestamp|null — sort thread list by this
        'priority',           // string - urgent | followup | resolved
    ];

    protected $casts = [
        'participants'    => 'array',
        'message_count'   => 'integer',
        'last_message_at' => 'datetime',
    ];

    public function integration(): BelongsTo
    {
        return $this->belongsTo(GmailIntegration::class, 'integration_id');
    }

    public function messages(): HasMany
    {
        // oldest first — thread reads naturally top to bottom
        return $this->hasMany(EmailMessage::class, 'email_thread_id')
                    ->orderBy('sent_at', 'asc');
    }
}
