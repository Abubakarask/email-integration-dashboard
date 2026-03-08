<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_threads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('integration_id')
                  ->constrained('gmail_integrations')
                  ->onDelete('cascade');

            $table->string('gmail_thread_id')->unique();      // "18f3a2b1c4d"
            $table->string('subject')->nullable();             // from first message
            $table->string('snippet')->nullable();             // latest message preview
            $table->json('participants')->nullable();          // ["alice@gmail.com", "bob@co.com"]
            $table->integer('message_count')->default(0);
            $table->timestamp('last_message_at')->nullable();  // for sorting

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_threads');
    }
};
