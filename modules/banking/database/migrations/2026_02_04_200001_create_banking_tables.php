<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bank Accounts (linked to company/journal concept)
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('account_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_bic')->nullable(); // SWIFT/BIC code
            $table->string('iban')->nullable();
            $table->enum('account_type', ['bank', 'cash', 'credit_card'])->default('bank');
            $table->string('currency_code', 3)->default('EUR');
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->decimal('last_statement_balance', 15, 2)->default(0);
            $table->date('last_statement_date')->nullable();
            $table->foreignId('partner_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->string('suspense_account_code')->nullable(); // For unreconciled items
            $table->boolean('active')->default(true);
            $table->json('settings')->nullable(); // Bank feed settings, import preferences
            $table->timestamps();
            $table->softDeletes();
        });

        // Bank Statements (groups transactions by period, like Odoo)
        Schema::create('bank_statements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('reference')->nullable(); // External reference from import
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('balance_start', 15, 2)->default(0);
            $table->decimal('balance_end', 15, 2)->default(0); // Computed from lines
            $table->decimal('balance_end_real', 15, 2)->default(0); // Stated ending balance
            $table->boolean('is_complete')->default(false); // Sum matches stated balance
            $table->boolean('is_valid')->default(true); // Matches previous statement
            $table->text('problem_description')->nullable();
            $table->string('first_line_index')->nullable(); // For ordering (like Odoo)
            $table->json('attachments')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['bank_account_id', 'date']);
            $table->index(['bank_account_id', 'first_line_index']);
        });

        // Bank Statement Lines (individual transactions)
        Schema::create('bank_statement_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('statement_id')->nullable()->constrained('bank_statements')->nullOnDelete();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->date('date');
            $table->string('payment_ref')->nullable(); // Transaction label/description
            $table->string('partner_name')->nullable(); // Name before partner is identified
            $table->foreignId('partner_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('currency_code', 3)->default('EUR');
            $table->decimal('amount_currency', 15, 2)->nullable(); // For multi-currency
            $table->string('foreign_currency_code', 3)->nullable();
            $table->decimal('running_balance', 15, 2)->nullable();
            $table->string('account_number')->nullable(); // Counterparty account
            $table->string('transaction_type')->nullable(); // From bank (SEPA, transfer, etc.)
            $table->integer('sequence')->default(1);
            $table->string('internal_index')->nullable(); // For fast sorting (date+sequence+id)
            $table->boolean('is_reconciled')->default(false);
            $table->decimal('amount_residual', 15, 2)->nullable(); // Amount left to reconcile
            $table->boolean('checked')->default(false); // User verified
            $table->json('transaction_details')->nullable(); // Raw data from import
            $table->timestamps();
            $table->softDeletes();

            $table->index(['bank_account_id', 'date']);
            $table->index(['bank_account_id', 'internal_index']);
            $table->index(['is_reconciled', 'bank_account_id']);
        });

        // Reconciliation Models (rules for auto-matching like Odoo)
        Schema::create('reconcile_models', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('rule_type', [
                'writeoff_button',      // Manual button to apply
                'writeoff_suggestion',  // Auto-suggested counterpart
                'invoice_matching'      // Auto-match with invoices
            ])->default('writeoff_button');
            $table->boolean('auto_reconcile')->default(false);
            $table->boolean('to_check')->default(false);
            $table->enum('matching_order', ['old_first', 'new_first'])->default('old_first');
            $table->integer('sequence')->default(10);
            $table->boolean('active')->default(true);

            // Conditions
            $table->boolean('match_text_location_label')->default(true);
            $table->boolean('match_text_location_note')->default(false);
            $table->boolean('match_text_location_reference')->default(false);
            $table->enum('match_nature', ['amount_received', 'amount_paid', 'both'])->default('both');
            $table->enum('match_amount', ['lower', 'greater', 'between'])->nullable();
            $table->decimal('match_amount_min', 15, 2)->nullable();
            $table->decimal('match_amount_max', 15, 2)->nullable();
            $table->enum('match_label', ['contains', 'not_contains', 'match_regex'])->nullable();
            $table->string('match_label_param')->nullable();
            $table->enum('match_note', ['contains', 'not_contains', 'match_regex'])->nullable();
            $table->string('match_note_param')->nullable();
            $table->boolean('match_same_currency')->default(true);
            $table->boolean('allow_payment_tolerance')->default(true);
            $table->decimal('payment_tolerance_param', 5, 2)->default(0);
            $table->enum('payment_tolerance_type', ['percentage', 'fixed_amount'])->default('percentage');
            $table->boolean('match_partner')->default(false);
            $table->integer('past_months_limit')->default(18);
            $table->string('decimal_separator')->default('.');

            $table->timestamps();
        });

        // Reconcile Model Lines (what to create when rule matches)
        Schema::create('reconcile_model_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reconcile_model_id')->constrained('reconcile_models')->cascadeOnDelete();
            $table->integer('sequence')->default(10);
            $table->string('account_code')->nullable(); // Account to use
            $table->string('label')->nullable();
            $table->enum('amount_type', ['fixed', 'percentage', 'percentage_st_line', 'regex'])->default('percentage');
            $table->string('amount_string')->default('100');
            $table->decimal('amount', 15, 2)->default(0);
            $table->boolean('force_tax_included')->default(false);
            $table->json('tax_ids')->nullable();
            $table->json('analytic_distribution')->nullable();
            $table->timestamps();
        });

        // Partner Mapping for reconciliation (like Odoo)
        Schema::create('reconcile_model_partner_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reconcile_model_id')->constrained('reconcile_models')->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('payment_ref_regex')->nullable();
            $table->string('narration_regex')->nullable();
            $table->timestamps();
        });

        // Partial Reconciliation (links transaction to invoices/payments)
        Schema::create('partial_reconciles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_statement_line_id')->constrained('bank_statement_lines')->cascadeOnDelete();
            $table->string('reconcile_type'); // 'invoice', 'payment', 'manual'
            $table->unsignedBigInteger('reconcile_id'); // ID of matched record
            $table->string('reconcile_model')->nullable(); // Model class
            $table->decimal('amount', 15, 2);
            $table->string('currency_code', 3)->default('EUR');
            $table->decimal('amount_currency', 15, 2)->nullable();
            $table->date('max_date');
            $table->foreignId('full_reconcile_id')->nullable();
            $table->timestamps();

            $table->index(['reconcile_type', 'reconcile_id']);
        });

        // Full Reconciliation (when fully matched)
        Schema::create('full_reconciles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Import History
        Schema::create('bank_import_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->string('filename');
            $table->string('format'); // csv, ofx, qif, camt
            $table->integer('transactions_count')->default(0);
            $table->integer('transactions_imported')->default(0);
            $table->integer('transactions_skipped')->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->json('details')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_import_history');
        Schema::dropIfExists('full_reconciles');
        Schema::dropIfExists('partial_reconciles');
        Schema::dropIfExists('reconcile_model_partner_mappings');
        Schema::dropIfExists('reconcile_model_lines');
        Schema::dropIfExists('reconcile_models');
        Schema::dropIfExists('bank_statement_lines');
        Schema::dropIfExists('bank_statements');
        Schema::dropIfExists('bank_accounts');
    }
};
