<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->string('provider'); // gocardless, plaid, etc.
            $table->string('institution_id')->nullable();
            $table->string('institution_name')->nullable();
            $table->string('institution_logo')->nullable();
            $table->string('external_account_id')->nullable(); // Provider's account ID
            $table->text('credentials'); // Encrypted JSON with tokens
            $table->enum('status', ['pending', 'active', 'error', 'expired', 'revoked'])->default('pending');
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamp('next_sync_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('error_message')->nullable();
            $table->boolean('sync_enabled')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['provider', 'status']);
            $table->index('next_sync_at');
        });

        Schema::create('bank_connection_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_connection_id')->constrained('bank_connections')->cascadeOnDelete();
            $table->enum('status', ['success', 'error', 'skipped'])->default('success');
            $table->integer('transactions_count')->default(0);
            $table->text('error_message')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['bank_connection_id', 'created_at']);
        });

        // Add connection_id to bank_accounts
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->string('bank_feeds_source')->nullable()->after('settings'); // manual, gocardless, plaid
        });
    }

    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn('bank_feeds_source');
        });

        Schema::dropIfExists('bank_connection_sync_logs');
        Schema::dropIfExists('bank_connections');
    }
};
