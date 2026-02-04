<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Currencies table
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique(); // ISO 4217
            $table->string('name');
            $table->string('symbol', 10);
            $table->integer('decimal_places')->default(2);
            $table->decimal('rate', 20, 10)->default(1); // Rate to base currency
            $table->boolean('is_base')->default(false);
            $table->boolean('active')->default(true);
            $table->string('position', 10)->default('before'); // before/after
            $table->timestamps();
        });

        // Tax groups (VAT, Sales Tax, etc.)
        Schema::create('tax_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->integer('sequence')->default(10);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Taxes
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->foreignId('tax_group_id')->nullable()->constrained('tax_groups')->nullOnDelete();
            $table->enum('type', ['percent', 'fixed'])->default('percent');
            $table->decimal('amount', 10, 4)->default(0); // Percentage or fixed amount
            $table->enum('type_tax_use', ['sale', 'purchase', 'none'])->default('sale');
            $table->enum('tax_scope', ['service', 'consu', 'all'])->nullable(); // Product type scope
            $table->boolean('price_include')->default(false); // Tax included in price
            $table->boolean('include_base_amount')->default(false); // Include in base for other taxes
            $table->string('description')->nullable();
            $table->integer('sequence')->default(10);
            $table->boolean('active')->default(true);
            
            // For country-specific tax handling
            $table->string('country_code', 2)->nullable();
            $table->json('extra_data')->nullable(); // For localization-specific fields
            
            $table->timestamps();
            
            $table->index(['type_tax_use', 'active']);
            $table->index('country_code');
        });

        // Invoice sequences
        Schema::create('invoice_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g., 'invoice', 'credit_note', 'bill'
            $table->string('name');
            $table->string('prefix')->default('');
            $table->string('suffix')->default('');
            $table->integer('padding')->default(5);
            $table->integer('next_number')->default(1);
            $table->boolean('use_date_range')->default(true);
            $table->string('date_format')->default('Y'); // For yearly sequences
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Sequence date ranges (for yearly/monthly sequences)
        Schema::create('invoice_sequence_ranges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sequence_id')->constrained('invoice_sequences')->cascadeOnDelete();
            $table->date('date_from');
            $table->date('date_to');
            $table->integer('next_number')->default(1);
            $table->timestamps();

            $table->unique(['sequence_id', 'date_from', 'date_to']);
        });

        // Products (simplified for invoicing)
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable()->index();
            $table->string('barcode')->nullable()->index();
            $table->enum('type', ['consu', 'service', 'storable'])->default('consu');
            $table->text('description')->nullable();
            $table->text('description_sale')->nullable();
            $table->text('description_purchase')->nullable();
            $table->decimal('list_price', 15, 4)->default(0); // Sale price
            $table->decimal('standard_price', 15, 4)->default(0); // Cost price
            $table->string('default_code')->nullable(); // Internal reference
            $table->string('uom')->default('unit'); // Unit of measure
            $table->foreignId('sale_tax_id')->nullable()->constrained('taxes')->nullOnDelete();
            $table->foreignId('purchase_tax_id')->nullable()->constrained('taxes')->nullOnDelete();
            $table->string('category')->nullable();
            $table->boolean('sale_ok')->default(true);
            $table->boolean('purchase_ok')->default(true);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Expand invoices table
        Schema::table('invoices', function (Blueprint $table) {
            // Move type (like Odoo's account.move)
            $table->enum('move_type', [
                'out_invoice',   // Customer Invoice
                'out_refund',    // Customer Credit Note
                'in_invoice',    // Vendor Bill
                'in_refund',     // Vendor Credit Note
                'entry',         // Journal Entry (for future accounting)
            ])->default('out_invoice')->after('id');

            // State machine
            $table->string('state')->default('draft')->after('status');
            
            // Reference and origin
            $table->string('ref')->nullable()->after('number'); // External reference
            $table->string('origin')->nullable(); // Source document (SO, PO, etc.)
            $table->string('invoice_origin')->nullable(); // For credit notes - original invoice
            
            // Partner details at invoice time (denormalized for history)
            $table->string('partner_shipping_id')->nullable(); // Delivery address
            $table->text('partner_address')->nullable(); // Frozen address
            $table->string('partner_vat')->nullable(); // VAT at invoice time
            
            // Fiscal details
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->decimal('currency_rate', 20, 10)->default(1);
            $table->foreignId('payment_term_id')->nullable()->constrained('payment_terms')->nullOnDelete();
            
            // Amounts in company currency (for reporting)
            $table->decimal('amount_untaxed', 15, 2)->default(0); // Subtotal
            $table->decimal('amount_tax', 15, 2)->default(0);
            $table->decimal('amount_total', 15, 2)->default(0);
            $table->decimal('amount_residual', 15, 2)->default(0); // Amount due
            
            // Amounts in document currency
            $table->decimal('amount_untaxed_signed', 15, 2)->default(0);
            $table->decimal('amount_tax_signed', 15, 2)->default(0);
            $table->decimal('amount_total_signed', 15, 2)->default(0);
            $table->decimal('amount_residual_signed', 15, 2)->default(0);
            
            // Dates
            $table->date('invoice_date')->nullable(); // Same as issue_date but clearer name
            $table->date('invoice_date_due')->nullable();
            $table->date('accounting_date')->nullable(); // For posting to different period
            
            // Payment state
            $table->enum('payment_state', [
                'not_paid',
                'in_payment',
                'paid',
                'partial',
                'reversed',
            ])->default('not_paid');
            
            // Narration/Notes
            $table->text('narration')->nullable();
            
            // Sequence
            $table->foreignId('sequence_id')->nullable()->constrained('invoice_sequences')->nullOnDelete();
            
            // Company (for multi-company)
            $table->foreignId('company_id')->nullable();
            
            // Auto-post
            $table->boolean('auto_post')->default(false);
            $table->string('auto_post_origin_id')->nullable();
            
            // Quick creation date
            $table->date('quick_edit_date')->nullable();
            
            // EDI state (for electronic invoicing - will be extended by l10n modules)
            $table->string('edi_state')->nullable();
            $table->json('edi_data')->nullable();
            
            // Indexes
            $table->index('move_type');
            $table->index('state');
            $table->index('payment_state');
            $table->index(['move_type', 'state']);
            $table->index('invoice_date');
        });

        // Expand invoice items (now invoice_lines)
        Schema::table('invoice_items', function (Blueprint $table) {
            // Product link
            $table->foreignId('product_id')->nullable()->after('invoice_id')->constrained('products')->nullOnDelete();
            
            // Better naming
            $table->string('name')->nullable()->after('description'); // Line name/label
            
            // Pricing details
            $table->decimal('price_unit', 15, 4)->default(0)->after('unit_price');
            $table->decimal('price_subtotal', 15, 2)->default(0); // Without tax
            $table->decimal('price_total', 15, 2)->default(0); // With tax
            $table->decimal('discount', 5, 2)->default(0); // Discount percentage
            
            // Tax handling
            $table->json('tax_ids')->nullable(); // Array of tax IDs
            $table->json('tax_details')->nullable(); // Computed tax breakdown
            
            // Account (for future accounting integration)
            $table->string('account_code')->nullable();
            
            // Analytics
            $table->string('analytic_account')->nullable();
            $table->json('analytic_distribution')->nullable();
            
            // Display
            $table->enum('display_type', ['product', 'line_section', 'line_note'])->default('product');
            $table->integer('sequence')->default(10);
            
            // For credit notes
            $table->foreignId('refund_line_id')->nullable();
        });

        // Tax amount per line (for complex tax scenarios)
        Schema::create('invoice_line_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_line_id')->constrained('invoice_items')->cascadeOnDelete();
            $table->foreignId('tax_id')->constrained('taxes')->cascadeOnDelete();
            $table->decimal('base', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['invoice_line_id', 'tax_id']);
        });

        // Invoice tax summary (aggregated taxes per invoice)
        Schema::create('invoice_tax_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('tax_id')->constrained('taxes')->cascadeOnDelete();
            $table->string('tax_name');
            $table->decimal('tax_rate', 10, 4)->default(0);
            $table->decimal('base', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->index(['invoice_id', 'tax_id']);
        });

        // Seed default currencies
        $this->seedCurrencies();
        
        // Seed default sequences
        $this->seedSequences();
        
        // Seed default tax groups
        $this->seedTaxGroups();
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_tax_lines');
        Schema::dropIfExists('invoice_line_taxes');
        
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn([
                'product_id', 'name', 'price_unit', 'price_subtotal', 'price_total',
                'discount', 'tax_ids', 'tax_details', 'account_code', 'analytic_account',
                'analytic_distribution', 'display_type', 'sequence', 'refund_line_id'
            ]);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropForeign(['payment_term_id']);
            $table->dropForeign(['sequence_id']);
            $table->dropColumn([
                'move_type', 'state', 'ref', 'origin', 'invoice_origin',
                'partner_shipping_id', 'partner_address', 'partner_vat',
                'currency_id', 'currency_rate', 'payment_term_id',
                'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual',
                'amount_untaxed_signed', 'amount_tax_signed', 'amount_total_signed', 'amount_residual_signed',
                'invoice_date', 'invoice_date_due', 'accounting_date', 'payment_state',
                'narration', 'sequence_id', 'company_id', 'auto_post', 'auto_post_origin_id',
                'quick_edit_date', 'edi_state', 'edi_data'
            ]);
        });

        Schema::dropIfExists('products');
        Schema::dropIfExists('invoice_sequence_ranges');
        Schema::dropIfExists('invoice_sequences');
        Schema::dropIfExists('taxes');
        Schema::dropIfExists('tax_groups');
        Schema::dropIfExists('currencies');
    }

    protected function seedCurrencies(): void
    {
        $currencies = [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'decimal_places' => 2, 'is_base' => true],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'decimal_places' => 2, 'rate' => 0.92],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'decimal_places' => 2, 'rate' => 0.79],
            ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'C$', 'decimal_places' => 2, 'rate' => 1.36],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$', 'decimal_places' => 2, 'rate' => 1.53],
            ['code' => 'CHF', 'name' => 'Swiss Franc', 'symbol' => 'CHF', 'decimal_places' => 2, 'rate' => 0.88],
            ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥', 'decimal_places' => 0, 'rate' => 149.50],
            ['code' => 'CNY', 'name' => 'Chinese Yuan', 'symbol' => '¥', 'decimal_places' => 2, 'rate' => 7.24],
            ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹', 'decimal_places' => 2, 'rate' => 83.12],
            ['code' => 'MXN', 'name' => 'Mexican Peso', 'symbol' => '$', 'decimal_places' => 2, 'rate' => 17.15],
            ['code' => 'BRL', 'name' => 'Brazilian Real', 'symbol' => 'R$', 'decimal_places' => 2, 'rate' => 4.97],
        ];

        foreach ($currencies as $currency) {
            \DB::table('currencies')->insert(array_merge($currency, [
                'rate' => $currency['rate'] ?? 1,
                'is_base' => $currency['is_base'] ?? false,
                'active' => true,
                'position' => 'before',
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    protected function seedSequences(): void
    {
        $sequences = [
            ['code' => 'out_invoice', 'name' => 'Customer Invoice', 'prefix' => 'INV/', 'padding' => 5],
            ['code' => 'out_refund', 'name' => 'Customer Credit Note', 'prefix' => 'RINV/', 'padding' => 5],
            ['code' => 'in_invoice', 'name' => 'Vendor Bill', 'prefix' => 'BILL/', 'padding' => 5],
            ['code' => 'in_refund', 'name' => 'Vendor Credit Note', 'prefix' => 'RBILL/', 'padding' => 5],
        ];

        foreach ($sequences as $sequence) {
            \DB::table('invoice_sequences')->insert(array_merge($sequence, [
                'suffix' => '',
                'next_number' => 1,
                'use_date_range' => true,
                'date_format' => 'Y',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    protected function seedTaxGroups(): void
    {
        $groups = [
            ['code' => 'taxes', 'name' => 'Taxes', 'sequence' => 0],
            ['code' => 'vat', 'name' => 'VAT', 'sequence' => 10],
            ['code' => 'sales_tax', 'name' => 'Sales Tax', 'sequence' => 20],
            ['code' => 'withholding', 'name' => 'Withholding', 'sequence' => 30],
        ];

        foreach ($groups as $group) {
            \DB::table('tax_groups')->insert(array_merge($group, [
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
};
