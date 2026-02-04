<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add Italian EDI fields to invoices
        Schema::table('invoices', function (Blueprint $table) {
            // SDI State and tracking
            $table->string('l10n_it_edi_state', 50)->nullable()->after('edi_state');
            $table->string('l10n_it_edi_transaction', 100)->nullable()->after('l10n_it_edi_state');
            $table->text('l10n_it_edi_error')->nullable()->after('l10n_it_edi_transaction');
            $table->timestamp('l10n_it_edi_sent_at')->nullable()->after('l10n_it_edi_error');
            $table->timestamp('l10n_it_edi_received_at')->nullable()->after('l10n_it_edi_sent_at');
            
            // FatturaPA specific fields
            $table->decimal('l10n_it_stamp_duty', 10, 2)->default(0)->after('l10n_it_edi_received_at');
            $table->string('l10n_it_origin_document_type', 20)->nullable();
            $table->string('l10n_it_origin_document_name', 100)->nullable();
            $table->date('l10n_it_origin_document_date')->nullable();
            $table->string('l10n_it_cig', 15)->nullable(); // Codice Identificativo Gara
            $table->string('l10n_it_cup', 15)->nullable(); // Codice Unico Progetto
            
            // DDT reference
            $table->string('l10n_it_ddt_number', 50)->nullable();
            $table->date('l10n_it_ddt_date')->nullable();
            
            // Indexes
            $table->index('l10n_it_edi_state');
            $table->index('l10n_it_edi_transaction');
        });

        // Add Italian fields to contacts
        Schema::table('contacts', function (Blueprint $table) {
            // Fiscal identifiers
            $table->string('l10n_it_codice_fiscale', 16)->nullable()->after('vat');
            $table->string('l10n_it_pa_index', 7)->nullable()->after('l10n_it_codice_fiscale'); // Codice Destinatario PA
            $table->string('l10n_it_pec_email', 255)->nullable()->after('l10n_it_pa_index');
            $table->boolean('l10n_it_is_pa')->default(false)->after('l10n_it_pec_email'); // Is Public Administration
            
            // Indexes
            $table->index('l10n_it_codice_fiscale');
            $table->index('l10n_it_pa_index');
        });

        // Create Italian EDI attachments table
        Schema::create('l10n_it_edi_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['sent', 'notification', 'receipt', 'rejection'])->default('sent');
            $table->string('filename', 255);
            $table->binary('content')->nullable();
            $table->string('sdi_identifier', 100)->nullable();
            $table->string('sdi_message_id', 100)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index(['invoice_id', 'type']);
            $table->index('sdi_identifier');
        });

        // Create Italian EDI log table
        Schema::create('l10n_it_edi_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('action', 50); // send, receive_notification, receive_receipt, etc.
            $table->string('status', 20); // success, error
            $table->text('request')->nullable();
            $table->text('response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index(['invoice_id', 'created_at']);
        });

        // Italian tax configuration table
        Schema::create('l10n_it_tax_natura', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tax_id')->constrained('taxes')->cascadeOnDelete();
            $table->string('natura_code', 10); // N1, N2.1, N2.2, etc.
            $table->string('law_reference', 255)->nullable(); // Riferimento normativo
            $table->timestamps();
            
            $table->unique('tax_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('l10n_it_tax_natura');
        Schema::dropIfExists('l10n_it_edi_logs');
        Schema::dropIfExists('l10n_it_edi_attachments');

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['l10n_it_codice_fiscale']);
            $table->dropIndex(['l10n_it_pa_index']);
            $table->dropColumn([
                'l10n_it_codice_fiscale',
                'l10n_it_pa_index',
                'l10n_it_pec_email',
                'l10n_it_is_pa',
            ]);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['l10n_it_edi_state']);
            $table->dropIndex(['l10n_it_edi_transaction']);
            $table->dropColumn([
                'l10n_it_edi_state',
                'l10n_it_edi_transaction',
                'l10n_it_edi_error',
                'l10n_it_edi_sent_at',
                'l10n_it_edi_received_at',
                'l10n_it_stamp_duty',
                'l10n_it_origin_document_type',
                'l10n_it_origin_document_name',
                'l10n_it_origin_document_date',
                'l10n_it_cig',
                'l10n_it_cup',
                'l10n_it_ddt_number',
                'l10n_it_ddt_date',
            ]);
        });
    }
};
