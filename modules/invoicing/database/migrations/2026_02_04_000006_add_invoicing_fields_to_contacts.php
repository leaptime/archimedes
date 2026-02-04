<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->decimal('credit_limit', 12, 2)->nullable()->default(0);
            $table->unsignedBigInteger('payment_term_id')->nullable();
            $table->string('tax_id', 50)->nullable();
            $table->string('billing_email')->nullable();
            $table->text('billing_address')->nullable();
            $table->string('currency', 3)->nullable()->default('EUR');

            $table->foreign('payment_term_id')
                ->references('id')
                ->on('payment_terms')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropForeign(['payment_term_id']);
            $table->dropColumn([
                'credit_limit',
                'payment_term_id',
                'tax_id',
                'billing_email',
                'billing_address',
                'currency',
            ]);
        });
    }
};
