<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that need organization_id for multi-tenancy
     */
    protected array $tables = [
        // Contacts module
        'contacts',
        'contact_addresses',
        'contact_bank_accounts',
        'contact_categories',
        'contact_custom_fields',
        'contact_custom_field_values',
        
        // Invoicing module
        'invoices',
        'invoice_lines',
        'products',
        'taxes',
        'tax_groups',
        'currencies',
        'payment_terms',
        'journals',
        'payment_methods',
        'payments',
        'sequences',
        
        // Banking module
        'bank_accounts',
        'bank_statements',
        'bank_statement_lines',
        'bank_reconciliations',
        'bank_reconciliation_lines',
        'bank_connections',
        
        // Cash Book module
        'cashbook_entries',
        'cashbook_entry_lines',
        'cashbook_sequences',
        
        // CRM module
        'crm_stages',
        'crm_teams',
        'crm_leads',
        'crm_activities',
        'crm_lost_reasons',
        'crm_tags',
        'crm_lead_tags',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'organization_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('organization_id')
                        ->nullable()
                        ->after('id')
                        ->constrained()
                        ->cascadeOnDelete();
                    
                    $table->index('organization_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'organization_id')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->dropForeign([$tableName . '_organization_id_foreign']);
                    $table->dropColumn('organization_id');
                });
            }
        }
    }
};
