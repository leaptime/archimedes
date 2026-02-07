<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tables to apply Row-Level Security policies
     */
    protected array $rlsTables = [
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
     * Sets up PostgreSQL Row-Level Security for multi-tenant data isolation
     */
    public function up(): void
    {
        // Only run on PostgreSQL
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // Create the app settings for RLS context
        DB::statement("
            DO $$
            BEGIN
                -- Create custom configuration parameters if they don't exist
                PERFORM set_config('app.organization_id', '0', false);
                PERFORM set_config('app.partner_id', '0', false);
                PERFORM set_config('app.is_platform_admin', 'false', false);
            EXCEPTION WHEN OTHERS THEN
                -- Ignore errors if already exists
                NULL;
            END $$;
        ");

        foreach ($this->rlsTables as $table) {
            if ($this->tableExists($table)) {
                $this->enableRls($table);
            }
        }

        // Special RLS for users table (users can see other users in their org)
        if ($this->tableExists('users')) {
            $this->enableRlsForUsers();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->rlsTables as $table) {
            if ($this->tableExists($table)) {
                $this->disableRls($table);
            }
        }

        if ($this->tableExists('users')) {
            DB::statement("ALTER TABLE users DISABLE ROW LEVEL SECURITY");
            DB::statement("DROP POLICY IF EXISTS users_org_isolation ON users");
            DB::statement("DROP POLICY IF EXISTS users_platform_admin ON users");
            DB::statement("DROP POLICY IF EXISTS users_partner_access ON users");
        }
    }

    /**
     * Enable RLS on a table with standard tenant isolation
     */
    protected function enableRls(string $table): void
    {
        // Enable RLS
        DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");

        // Force RLS even for table owner (important for security)
        DB::statement("ALTER TABLE {$table} FORCE ROW LEVEL SECURITY");

        // Policy 1: Organization isolation (normal users)
        // Users can only see/modify data belonging to their organization
        DB::statement("
            CREATE POLICY {$table}_org_isolation ON {$table}
            FOR ALL
            USING (
                organization_id::text = current_setting('app.organization_id', true)
            )
            WITH CHECK (
                organization_id::text = current_setting('app.organization_id', true)
            )
        ");

        // Policy 2: Platform admin bypass
        // Platform admins can see all data
        DB::statement("
            CREATE POLICY {$table}_platform_admin ON {$table}
            FOR ALL
            USING (
                current_setting('app.is_platform_admin', true)::boolean = true
            )
            WITH CHECK (
                current_setting('app.is_platform_admin', true)::boolean = true
            )
        ");

        // Policy 3: Partner access
        // Partners can see data from all their managed organizations
        DB::statement("
            CREATE POLICY {$table}_partner_access ON {$table}
            FOR SELECT
            USING (
                current_setting('app.partner_id', true) != '0'
                AND current_setting('app.partner_id', true) != ''
                AND organization_id IN (
                    SELECT id FROM organizations 
                    WHERE partner_id::text = current_setting('app.partner_id', true)
                )
            )
        ");
    }

    /**
     * Enable RLS for users table with special handling
     */
    protected function enableRlsForUsers(): void
    {
        DB::statement("ALTER TABLE users ENABLE ROW LEVEL SECURITY");
        DB::statement("ALTER TABLE users FORCE ROW LEVEL SECURITY");

        // Users can see other users in their organization
        DB::statement("
            CREATE POLICY users_org_isolation ON users
            FOR ALL
            USING (
                organization_id::text = current_setting('app.organization_id', true)
                OR organization_id IS NULL
            )
            WITH CHECK (
                organization_id::text = current_setting('app.organization_id', true)
                OR organization_id IS NULL
            )
        ");

        // Platform admins can see all users
        DB::statement("
            CREATE POLICY users_platform_admin ON users
            FOR ALL
            USING (
                current_setting('app.is_platform_admin', true)::boolean = true
            )
            WITH CHECK (
                current_setting('app.is_platform_admin', true)::boolean = true
            )
        ");

        // Partners can see users from their organizations
        DB::statement("
            CREATE POLICY users_partner_access ON users
            FOR SELECT
            USING (
                current_setting('app.partner_id', true) != '0'
                AND current_setting('app.partner_id', true) != ''
                AND (
                    partner_id::text = current_setting('app.partner_id', true)
                    OR organization_id IN (
                        SELECT id FROM organizations 
                        WHERE partner_id::text = current_setting('app.partner_id', true)
                    )
                )
            )
        ");
    }

    /**
     * Disable RLS on a table
     */
    protected function disableRls(string $table): void
    {
        DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        DB::statement("DROP POLICY IF EXISTS {$table}_org_isolation ON {$table}");
        DB::statement("DROP POLICY IF EXISTS {$table}_platform_admin ON {$table}");
        DB::statement("DROP POLICY IF EXISTS {$table}_partner_access ON {$table}");
    }

    /**
     * Check if table exists
     */
    protected function tableExists(string $table): bool
    {
        return DB::select("
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ?
            ) as exists
        ", [$table])[0]->exists ?? false;
    }
};
