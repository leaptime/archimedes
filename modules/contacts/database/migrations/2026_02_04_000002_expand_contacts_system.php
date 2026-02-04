<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Contact Categories (Tags) - hierarchical
        Schema::create('contact_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color', 20)->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('contact_categories')->nullOnDelete();
            $table->string('parent_path')->nullable(); // For nested set queries
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('parent_path');
            $table->index('active');
        });

        // Contact-Category pivot
        Schema::create('contact_category_pivot', function (Blueprint $table) {
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('contact_categories')->cascadeOnDelete();
            $table->primary(['contact_id', 'category_id']);
        });

        // Contact Titles (Mr, Mrs, Dr, etc.)
        Schema::create('contact_titles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('shortcut', 20)->nullable();
            $table->timestamps();
        });

        // Industries
        Schema::create('industries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('full_name')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('active');
        });

        // Countries (if not exists)
        if (!Schema::hasTable('countries')) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 3)->unique();
                $table->string('phone_code', 10)->nullable();
                $table->string('currency_code', 3)->nullable();
                $table->string('address_format')->nullable();
                $table->string('vat_label')->nullable();
                $table->timestamps();

                $table->index('code');
            });
        }

        // Country States/Regions
        if (!Schema::hasTable('country_states')) {
            Schema::create('country_states', function (Blueprint $table) {
                $table->id();
                $table->foreignId('country_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('code', 10);
                $table->timestamps();

                $table->unique(['country_id', 'code']);
            });
        }

        // Expand contacts table
        Schema::table('contacts', function (Blueprint $table) {
            // Identity & Classification
            $table->string('ref', 50)->nullable()->after('id'); // Internal reference
            $table->string('display_name')->nullable()->after('name'); // Computed display name
            $table->string('complete_name')->nullable()->after('display_name'); // With company name
            $table->foreignId('title_id')->nullable()->after('name')->constrained('contact_titles')->nullOnDelete();
            
            // Type system (like Odoo)
            $table->enum('type', ['contact', 'invoice', 'delivery', 'private', 'other'])->default('contact')->after('is_company');
            $table->string('company_type', 20)->nullable()->after('type'); // person, company, ngo, government
            
            // Industry classification
            $table->foreignId('industry_id')->nullable()->after('company')->constrained('industries')->nullOnDelete();
            
            // Tax & Legal
            $table->string('vat', 50)->nullable()->after('industry_id'); // Tax ID / VAT
            $table->string('company_registry', 50)->nullable()->after('vat'); // Company registration number
            
            // Better address with proper foreign keys
            $table->string('street')->nullable()->after('company_registry');
            $table->string('street2')->nullable()->after('street');
            $table->foreignId('country_id')->nullable()->after('country')->constrained('countries')->nullOnDelete();
            $table->foreignId('state_id')->nullable()->after('country_id')->constrained('country_states')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable()->after('state_id');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            
            // Communication preferences
            $table->string('lang', 10)->nullable()->after('website'); // Preferred language
            $table->string('timezone', 50)->nullable()->after('lang');
            $table->string('email_formatted')->nullable()->after('email'); // "Name <email>"
            
            // Media
            $table->string('image_path')->nullable()->after('notes');
            $table->integer('color')->default(0)->after('image_path');
            
            // Commercial
            $table->foreignId('commercial_partner_id')->nullable()->after('parent_id'); // Billing entity
            $table->string('commercial_company_name')->nullable()->after('commercial_partner_id');
            $table->foreignId('salesperson_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            
            // Flags
            $table->boolean('is_customer')->default(false)->after('is_company');
            $table->boolean('is_vendor')->default(false)->after('is_customer');
            $table->boolean('is_employee')->default(false)->after('is_vendor');
            $table->boolean('active')->default(true)->after('is_employee');
            
            // Rankings (for sorting customers/suppliers by activity)
            $table->integer('customer_rank')->default(0)->after('active');
            $table->integer('supplier_rank')->default(0)->after('customer_rank');
            
            // Barcode
            $table->string('barcode', 50)->nullable()->after('supplier_rank');
            
            // Indexes
            $table->index('ref');
            $table->index('vat');
            $table->index('type');
            $table->index('is_customer');
            $table->index('is_vendor');
            $table->index('active');
            $table->index('commercial_partner_id');
            $table->index(['customer_rank', 'id']);
            $table->index(['supplier_rank', 'id']);
        });

        // Add self-referential foreign key for commercial_partner_id
        Schema::table('contacts', function (Blueprint $table) {
            $table->foreign('commercial_partner_id')->references('id')->on('contacts')->nullOnDelete();
        });

        // Bank Accounts
        Schema::create('contact_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->string('acc_number'); // Account number or IBAN
            $table->string('acc_holder_name')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_bic', 20)->nullable(); // SWIFT/BIC code
            $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->integer('sequence')->default(10);
            $table->timestamps();

            $table->index(['contact_id', 'active']);
            $table->index('acc_number');
        });

        // Contact Addresses (child contacts with address types)
        // This is handled by the contact itself with type field and parent_id
        // But we can create a view or helper table for quick address lookup
        Schema::create('contact_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete(); // The main contact
            $table->enum('type', ['invoice', 'delivery', 'private', 'other'])->default('invoice');
            $table->string('name')->nullable(); // Address label
            $table->string('street')->nullable();
            $table->string('street2')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->foreignId('state_id')->nullable()->constrained('country_states')->nullOnDelete();
            $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['contact_id', 'type']);
            $table->index(['contact_id', 'is_default']);
        });

        // Contact Custom Fields (for extensibility)
        Schema::create('contact_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('label');
            $table->string('field_type', 50); // string, text, number, date, boolean, select, multiselect
            $table->json('options')->nullable(); // For select/multiselect
            $table->boolean('required')->default(false);
            $table->boolean('searchable')->default(false);
            $table->string('applies_to')->default('all'); // all, company, individual
            $table->integer('sequence')->default(10);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('name');
            $table->index(['active', 'applies_to']);
        });

        // Contact Custom Field Values
        Schema::create('contact_custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('field_id')->constrained('contact_custom_fields')->cascadeOnDelete();
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['contact_id', 'field_id']);
        });

        // Seed some default data
        $this->seedDefaultData();
    }

    protected function seedDefaultData(): void
    {
        // Titles
        $titles = [
            ['name' => 'Mister', 'shortcut' => 'Mr.'],
            ['name' => 'Miss', 'shortcut' => 'Ms.'],
            ['name' => 'Madam', 'shortcut' => 'Mrs.'],
            ['name' => 'Doctor', 'shortcut' => 'Dr.'],
            ['name' => 'Professor', 'shortcut' => 'Prof.'],
        ];
        foreach ($titles as $title) {
            \DB::table('contact_titles')->insert(array_merge($title, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Industries
        $industries = [
            'Agriculture', 'Automotive', 'Banking', 'Construction', 'Consulting',
            'Education', 'Energy', 'Entertainment', 'Finance', 'Food & Beverage',
            'Healthcare', 'Hospitality', 'Information Technology', 'Insurance',
            'Legal Services', 'Manufacturing', 'Marketing', 'Media', 'Mining',
            'Non-Profit', 'Pharmaceuticals', 'Real Estate', 'Retail', 'Technology',
            'Telecommunications', 'Transportation', 'Utilities', 'Other'
        ];
        foreach ($industries as $industry) {
            \DB::table('industries')->insert([
                'name' => $industry,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Default categories
        $categories = [
            ['name' => 'Customer', 'color' => '#22c55e'],
            ['name' => 'Vendor', 'color' => '#3b82f6'],
            ['name' => 'Partner', 'color' => '#8b5cf6'],
            ['name' => 'Prospect', 'color' => '#f59e0b'],
            ['name' => 'VIP', 'color' => '#ef4444'],
        ];
        foreach ($categories as $cat) {
            \DB::table('contact_categories')->insert(array_merge($cat, [
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Some common countries
        $countries = [
            ['name' => 'United States', 'code' => 'US', 'phone_code' => '+1', 'currency_code' => 'USD'],
            ['name' => 'United Kingdom', 'code' => 'GB', 'phone_code' => '+44', 'currency_code' => 'GBP'],
            ['name' => 'Germany', 'code' => 'DE', 'phone_code' => '+49', 'currency_code' => 'EUR'],
            ['name' => 'France', 'code' => 'FR', 'phone_code' => '+33', 'currency_code' => 'EUR'],
            ['name' => 'Italy', 'code' => 'IT', 'phone_code' => '+39', 'currency_code' => 'EUR'],
            ['name' => 'Spain', 'code' => 'ES', 'phone_code' => '+34', 'currency_code' => 'EUR'],
            ['name' => 'Canada', 'code' => 'CA', 'phone_code' => '+1', 'currency_code' => 'CAD'],
            ['name' => 'Australia', 'code' => 'AU', 'phone_code' => '+61', 'currency_code' => 'AUD'],
            ['name' => 'Japan', 'code' => 'JP', 'phone_code' => '+81', 'currency_code' => 'JPY'],
            ['name' => 'China', 'code' => 'CN', 'phone_code' => '+86', 'currency_code' => 'CNY'],
            ['name' => 'India', 'code' => 'IN', 'phone_code' => '+91', 'currency_code' => 'INR'],
            ['name' => 'Brazil', 'code' => 'BR', 'phone_code' => '+55', 'currency_code' => 'BRL'],
        ];
        foreach ($countries as $country) {
            \DB::table('countries')->insert(array_merge($country, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function down(): void
    {
        // Remove foreign key first
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropForeign(['commercial_partner_id']);
        });

        Schema::dropIfExists('contact_custom_field_values');
        Schema::dropIfExists('contact_custom_fields');
        Schema::dropIfExists('contact_addresses');
        Schema::dropIfExists('contact_bank_accounts');
        Schema::dropIfExists('contact_category_pivot');
        Schema::dropIfExists('contact_categories');
        Schema::dropIfExists('contact_titles');
        Schema::dropIfExists('industries');

        // Remove added columns from contacts
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['ref']);
            $table->dropIndex(['vat']);
            $table->dropIndex(['type']);
            $table->dropIndex(['is_customer']);
            $table->dropIndex(['is_vendor']);
            $table->dropIndex(['active']);
            $table->dropIndex(['commercial_partner_id']);
            $table->dropIndex(['customer_rank', 'id']);
            $table->dropIndex(['supplier_rank', 'id']);

            $table->dropColumn([
                'ref', 'display_name', 'complete_name', 'title_id', 'type', 'company_type',
                'industry_id', 'vat', 'company_registry', 'street', 'street2',
                'country_id', 'state_id', 'latitude', 'longitude',
                'lang', 'timezone', 'email_formatted', 'image_path', 'color',
                'commercial_partner_id', 'commercial_company_name', 'salesperson_id',
                'is_customer', 'is_vendor', 'is_employee', 'active',
                'customer_rank', 'supplier_rank', 'barcode'
            ]);
        });

        Schema::dropIfExists('country_states');
        Schema::dropIfExists('countries');
    }
};
