<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('email_thread_id')
                  ->constrained()
                  ->onDelete('cascade');

            $table->string('gmail_thread_id');                // redundant but useful for lookups
            $table->string('gmail_message_id')->unique();     // Gmail's message ID

            // Sender
            $table->string('from_name')->nullable();
            $table->string('from_email');

            // Recipients (JSON arrays)
            $table->json('to');
            $table->json('cc')->nullable();
            $table->json('bcc')->nullable();

            // Content
            $table->string('subject')->nullable();
            $table->longText('body_html')->nullable();

            // Attachments metadata — lazy fetch, only store id + filename
            // [{ "attachmentId": "ANGjdJ...", "filename": "invoice.pdf" }]
            $table->json('attachments')->nullable();

            // Reply chain headers — needed to send a proper reply
            $table->string('message_id_header')->nullable();  // value of Message-ID header
            $table->string('in_reply_to')->nullable();        // value of In-Reply-To header

            // Metadata
            $table->json('labels')->nullable();               // ["INBOX", "UNREAD"]
            $table->boolean('is_sent')->default(false);       // true if SENT label present
            $table->timestamp('sent_at')->nullable();         // from internalDate (unix ms)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_messages');
    }
};
