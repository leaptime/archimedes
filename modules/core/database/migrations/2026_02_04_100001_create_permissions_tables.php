<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Groups/Roles table
        Schema::create('permission_groups', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique(); // e.g., 'contacts.group_manager'
            $table->string('name');
            $table->string('module')->nullable(); // Module that defines this group
            $table->string('category')->nullable(); // For UI grouping
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Group inheritance (implied_ids equivalent)
        Schema::create('permission_group_implications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('permission_groups')->onDelete('cascade');
            $table->foreignId('implied_group_id')->constrained('permission_groups')->onDelete('cascade');
            $table->unique(['group_id', 'implied_group_id']);
        });

        // User-Group assignments
        Schema::create('permission_group_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('permission_groups')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unique(['group_id', 'user_id']);
            $table->timestamps();
        });

        // Model Access Control Lists (ir.model.access equivalent)
        Schema::create('model_access', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique(); // e.g., 'access_contact_manager'
            $table->string('name');
            $table->string('model'); // e.g., 'contacts.contact'
            $table->foreignId('group_id')->nullable()->constrained('permission_groups')->onDelete('cascade');
            $table->boolean('perm_read')->default(false);
            $table->boolean('perm_write')->default(false);
            $table->boolean('perm_create')->default(false);
            $table->boolean('perm_unlink')->default(false);
            $table->string('module')->nullable(); // Module that defines this rule
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['model', 'group_id']);
        });

        // Record Rules (ir.rule equivalent)
        Schema::create('record_rules', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique(); // e.g., 'rule_contact_company'
            $table->string('name');
            $table->string('model'); // e.g., 'contacts.contact'
            $table->text('domain')->nullable(); // JSON or expression string
            $table->boolean('is_global')->default(false); // True = applies to all users
            $table->boolean('perm_read')->default(true);
            $table->boolean('perm_write')->default(true);
            $table->boolean('perm_create')->default(true);
            $table->boolean('perm_unlink')->default(true);
            $table->string('module')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('priority')->default(100);
            $table->timestamps();

            $table->index(['model', 'is_global']);
        });

        // Record Rule - Group assignments
        Schema::create('record_rule_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('record_rule_id')->constrained('record_rules')->onDelete('cascade');
            $table->foreignId('group_id')->constrained('permission_groups')->onDelete('cascade');
            $table->unique(['record_rule_id', 'group_id']);
        });

        // Field-level permissions (optional, for fine-grained control)
        Schema::create('field_access', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique();
            $table->string('model');
            $table->string('field');
            $table->foreignId('group_id')->nullable()->constrained('permission_groups')->onDelete('cascade');
            $table->boolean('perm_read')->default(true);
            $table->boolean('perm_write')->default(true);
            $table->string('module')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['model', 'field', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_access');
        Schema::dropIfExists('record_rule_groups');
        Schema::dropIfExists('record_rules');
        Schema::dropIfExists('model_access');
        Schema::dropIfExists('permission_group_users');
        Schema::dropIfExists('permission_group_implications');
        Schema::dropIfExists('permission_groups');
    }
};
