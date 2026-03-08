<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('gmail_integrations', function (Blueprint $table) {
            $table->string('sync_status')->default('not_started')->after('status');
            $table->text('sync_message')->nullable()->after('sync_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gmail_integrations', function (Blueprint $table) {
            $table->dropColumn(['sync_status', 'sync_message']);
        });
    }
};
