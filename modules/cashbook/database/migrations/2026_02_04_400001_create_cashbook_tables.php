<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cash Book Entries - main transaction register
        Schema::create('cashbook_entries', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique(); // CB-2026-00001
            $table->date('date');
            $table->enum('type', ['income', 'expense', 'transfer']); // entrata, uscita, giroconto
            $table->decimal('amount', 15, 2);
            $table->string('currency_code', 3)->default('EUR');
            $table->decimal('exchange_rate', 10, 6)->default(1.000000);
            
            // Payment method
            $table->enum('payment_method', [
                'cash',           // Contanti
                'bank_transfer',  // Bonifico
                'check',          // Assegno
                'credit_card',    // Carta di credito
                'direct_debit',   // RID/SDD
                'other'
            ])->default('bank_transfer');
            
            // Description and reference
            $table->string('description');
            $table->string('reference')->nullable(); // External reference (check number, etc.)
            $table->text('notes')->nullable();
            
            // Linked contact (customer/supplier)
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            
            // Bank account (which account this affects)
            $table->foreignId('bank_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            
            // Link to imported bank transaction (for reconciliation)
            $table->foreignId('bank_transaction_id')->nullable()->constrained('bank_statement_lines')->nullOnDelete();
            
            // For transfers between accounts
            $table->foreignId('transfer_to_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->foreignId('linked_entry_id')->nullable(); // The opposite entry in a transfer
            
            // Status
            $table->enum('state', ['draft', 'confirmed', 'reconciled', 'cancelled'])->default('draft');
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Allocation tracking
            $table->decimal('amount_allocated', 15, 2)->default(0); // How much is applied to invoices
            $table->decimal('amount_unallocated', 15, 2)->storedAs('amount - amount_allocated'); // Remaining
            
            // Multi-tenancy
            $table->unsignedBigInteger('company_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['date', 'type']);
            $table->index(['contact_id', 'date']);
            $table->index(['state', 'date']);
            $table->index('bank_transaction_id');
        });
        
        // Cash Book Allocations - links entries to invoices (M:N with amount)
        Schema::create('cashbook_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashbook_entry_id')->constrained('cashbook_entries')->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->decimal('amount_applied', 15, 2); // Amount from this entry applied to this invoice
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Prevent duplicate allocations
            $table->unique(['cashbook_entry_id', 'invoice_id']);
            
            // Index for fast invoice lookups
            $table->index('invoice_id');
        });
        
        // Sequence for entry numbers
        Schema::create('cashbook_sequences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->year('year');
            $table->unsignedInteger('next_number')->default(1);
            $table->string('prefix')->default('CB');
            $table->timestamps();
            
            $table->unique(['company_id', 'year']);
        });
        
        // Add payment tracking fields to invoices if not exists
        if (!Schema::hasColumn('invoices', 'amount_paid')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->decimal('amount_paid', 15, 2)->default(0)->after('amount_total');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cashbook_allocations');
        Schema::dropIfExists('cashbook_entries');
        Schema::dropIfExists('cashbook_sequences');
        
        if (Schema::hasColumn('invoices', 'amount_paid')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('amount_paid');
            });
        }
    }
};
