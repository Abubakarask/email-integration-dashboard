<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmail_integrations', function (Blueprint $table) {
            $table->id();

            // Which user this integration belongs to
            $table->foreignId('user_id')
                  ->constrained()
                  ->onDelete('cascade');

            // Status — mirrors your GoogleIntegrationStatus enum
            // pending → active → expired/revoked/error/disabled
            $table->enum('status', [
                'pending',
                'active',
                'expired',
                'revoked',
                'error',
                'disabled',
            ])->default('pending');

            // OAuth tokens — store as plain text (encrypt in production via Laravel Crypt)
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();  // long-lived, used to refresh access token

            // Google account metadata
            $table->string('google_user_id')->nullable();    // Google's "sub" field from id_token
            $table->string('google_user_email')->nullable(); // e.g. alice@gmail.com

            // PKCE state — stored temporarily during OAuth flow, cleared after callback
            $table->string('oauth_state')->nullable();          // random state param (CSRF protection)
            $table->text('code_verifier')->nullable();          // PKCE verifier, cleared after use

            // Sync tracking
            $table->string('last_history_id')->nullable();      // Gmail historyId for incremental sync
            $table->integer('synced_days')->nullable();         // how many days user chose to sync
            $table->timestamp('last_synced_at')->nullable();    // when last sync ran

            // Error tracking
            $table->text('error_message')->nullable();
            $table->timestamp('last_error_at')->nullable();
            $table->timestamp('connected_at')->nullable();

            $table->timestamps();

            // One integration per user
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmail_integrations');
    }
};
