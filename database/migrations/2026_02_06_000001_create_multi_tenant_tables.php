<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the core multi-tenant infrastructure: Partners and Organizations
     */
    public function up(): void
    {
        // Partners (resellers who manage organizations)
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique(); // Unique partner code (e.g., PARTNER-001)
            $table->string('legal_name')->nullable();
            $table->string('type')->default('reseller'); // reseller, affiliate, distributor
            $table->string('status')->default('active'); // active, suspended, terminated
            
            // Contact information
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            
            // Address
            $table->string('street')->nullable();
            $table->string('street2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip')->nullable();
            $table->string('country', 2)->default('US');
            
            // Tax & Legal
            $table->string('tax_id')->nullable();
            $table->string('vat_number')->nullable();
            
            // Commission & Billing
            $table->decimal('commission_rate', 5, 2)->default(20.00); // Percentage of monthly revenue
            $table->decimal('minimum_payout', 10, 2)->default(100.00); // Minimum amount for payout
            $table->string('payout_method')->default('bank_transfer'); // bank_transfer, paypal, stripe
            $table->json('payout_details')->nullable(); // Bank account, PayPal email, etc.
            $table->string('currency', 3)->default('USD');
            
            // Limits
            $table->integer('max_organizations')->nullable(); // null = unlimited
            $table->integer('max_users_per_org')->nullable(); // null = unlimited
            
            // Branding (white-label)
            $table->string('logo_path')->nullable();
            $table->string('primary_color')->nullable();
            $table->string('custom_domain')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('status');
            $table->index('type');
        });

        // Organizations (tenants - companies, NGOs, public administrations, etc.)
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            
            // Basic info
            $table->string('name');
            $table->string('code', 50)->unique(); // Unique org code (e.g., ORG-12345)
            $table->string('legal_name')->nullable();
            $table->string('type')->default('company'); // company, nonprofit, government, education, individual
            $table->string('status')->default('active'); // trial, active, suspended, cancelled
            
            // Contact information
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            
            // Address
            $table->string('street')->nullable();
            $table->string('street2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip')->nullable();
            $table->string('country', 2)->default('US');
            
            // Billing address (if different)
            $table->boolean('separate_billing_address')->default(false);
            $table->string('billing_street')->nullable();
            $table->string('billing_city')->nullable();
            $table->string('billing_state')->nullable();
            $table->string('billing_zip')->nullable();
            $table->string('billing_country', 2)->nullable();
            
            // Tax & Legal
            $table->string('tax_id')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('company_registry')->nullable();
            $table->string('industry')->nullable();
            
            // Subscription & Billing
            $table->string('plan')->default('free'); // free, starter, professional, enterprise
            $table->string('billing_cycle')->default('monthly'); // monthly, yearly
            $table->date('trial_ends_at')->nullable();
            $table->date('subscription_ends_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('stripe_customer_id')->nullable();
            
            // Limits & Usage
            $table->integer('max_users')->default(3);
            $table->bigInteger('storage_limit_bytes')->default(5368709120); // 5GB default
            $table->bigInteger('storage_used_bytes')->default(0);
            
            // Preferences
            $table->string('timezone')->default('UTC');
            $table->string('locale', 10)->default('en');
            $table->string('currency', 3)->default('USD');
            $table->string('date_format')->default('Y-m-d');
            $table->string('fiscal_year_start', 5)->default('01-01'); // MM-DD
            
            // Branding
            $table->string('logo_path')->nullable();
            
            // Modules (JSON array of enabled module IDs)
            $table->json('enabled_modules')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('partner_id');
            $table->index('status');
            $table->index('type');
            $table->index('plan');
        });

        // Organization modules (tracks which modules each org has enabled and their pricing)
        Schema::create('organization_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('module_id'); // e.g., 'crm', 'invoicing', 'banking'
            $table->boolean('is_active')->default(true);
            $table->date('activated_at');
            $table->date('expires_at')->nullable();
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('yearly_price', 10, 2)->default(0);
            $table->json('settings')->nullable(); // Module-specific settings
            $table->timestamps();
            
            $table->unique(['organization_id', 'module_id']);
            $table->index('module_id');
        });

        // Partner payouts (tracks commission payments to partners)
        Schema::create('partner_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('reference')->unique(); // Payout reference number
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->date('period_start');
            $table->date('period_end');
            $table->json('breakdown')->nullable(); // Detailed breakdown by organization
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable(); // External payment reference
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['partner_id', 'status']);
            $table->index('period_start');
        });

        // Partner revenue (tracks revenue generated by each organization for partner commission)
        Schema::create('partner_revenue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payout_id')->nullable()->constrained('partner_payouts')->nullOnDelete();
            $table->string('type'); // subscription, module, users, storage, overage
            $table->string('description');
            $table->decimal('gross_amount', 12, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->date('period_date'); // The month this revenue belongs to
            $table->string('status')->default('pending'); // pending, approved, paid
            $table->timestamps();
            
            $table->index(['partner_id', 'status']);
            $table->index(['organization_id', 'period_date']);
        });

        // Add organization_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('role')->default('member')->after('organization_id'); // owner, admin, member
            $table->boolean('is_platform_admin')->default(false)->after('role'); // Platform-level admin
            $table->foreignId('partner_id')->nullable()->after('is_platform_admin')->constrained()->nullOnDelete(); // If user is a partner user
            
            $table->index('organization_id');
            $table->index('partner_id');
        });

        // Organization invitations
        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('role')->default('member');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            
            $table->index(['organization_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['partner_id']);
            $table->dropColumn(['organization_id', 'role', 'is_platform_admin', 'partner_id']);
        });

        Schema::dropIfExists('organization_invitations');
        Schema::dropIfExists('partner_revenue');
        Schema::dropIfExists('partner_payouts');
        Schema::dropIfExists('organization_modules');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('partners');
    }
};
