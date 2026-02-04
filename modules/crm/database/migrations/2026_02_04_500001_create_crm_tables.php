<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // CRM Stages (Pipeline columns)
        Schema::create('crm_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('sequence')->default(10);
            $table->boolean('is_won')->default(false);
            $table->boolean('is_lost')->default(false);
            $table->integer('probability')->default(10); // Default win probability %
            $table->text('requirements')->nullable(); // Stage requirements/checklist
            $table->boolean('fold')->default(false); // Folded in kanban
            $table->string('color', 20)->nullable();
            $table->unsignedBigInteger('team_id')->nullable(); // If stage is team-specific
            $table->timestamps();
            
            $table->index('sequence');
        });

        // CRM Teams (Sales teams)
        Schema::create('crm_teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('use_leads')->default(true); // Use lead qualification
            $table->boolean('use_opportunities')->default(true);
            $table->string('alias_email')->nullable(); // Email for lead capture
            $table->string('color', 20)->nullable();
            $table->foreignId('leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->timestamps();
        });

        // CRM Team Members
        Schema::create('crm_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('crm_teams')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('assignment_max')->default(30); // Monthly lead quota
            $table->boolean('active')->default(true);
            $table->timestamps();
            
            $table->unique(['team_id', 'user_id']);
        });

        // CRM Lost Reasons
        Schema::create('crm_lost_reasons', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // CRM Tags
        Schema::create('crm_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color', 20)->nullable();
            $table->timestamps();
        });

        // CRM Leads/Opportunities (main table)
        Schema::create('crm_leads', function (Blueprint $table) {
            $table->id();
            
            // Basic info
            $table->string('name'); // Opportunity name
            $table->enum('type', ['lead', 'opportunity'])->default('lead');
            $table->boolean('active')->default(true);
            $table->integer('priority')->default(0); // 0=Low, 1=Medium, 2=High, 3=Very High
            $table->string('color', 20)->nullable();
            
            // Pipeline
            $table->foreignId('stage_id')->nullable()->constrained('crm_stages')->nullOnDelete();
            $table->integer('probability')->default(10); // Win probability %
            
            // Assignment
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // Salesperson
            $table->foreignId('team_id')->nullable()->constrained('crm_teams')->nullOnDelete();
            
            // Contact/Company (can link to existing contact or store inline)
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->string('contact_name')->nullable(); // If no linked contact
            $table->string('partner_name')->nullable(); // Company name
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('website')->nullable();
            $table->string('function')->nullable(); // Job title
            
            // Address
            $table->string('street')->nullable();
            $table->string('street2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip')->nullable();
            $table->string('country_code', 2)->nullable();
            
            // Revenue
            $table->decimal('expected_revenue', 15, 2)->default(0);
            $table->string('currency_code', 3)->default('EUR');
            $table->decimal('recurring_revenue', 15, 2)->default(0); // MRR
            $table->enum('recurring_plan', ['monthly', 'quarterly', 'yearly'])->nullable();
            
            // Dates
            $table->date('date_deadline')->nullable(); // Expected closing
            $table->timestamp('date_open')->nullable(); // When assigned
            $table->timestamp('date_closed')->nullable();
            $table->timestamp('date_conversion')->nullable(); // Lead→Opportunity
            $table->timestamp('date_last_stage_update')->nullable();
            
            // Lost
            $table->foreignId('lost_reason_id')->nullable()->constrained('crm_lost_reasons')->nullOnDelete();
            $table->text('lost_feedback')->nullable();
            
            // Source tracking (UTM)
            $table->string('source')->nullable(); // utm_source
            $table->string('medium')->nullable(); // utm_medium
            $table->string('campaign')->nullable(); // utm_campaign
            $table->string('referred_by')->nullable();
            
            // Notes
            $table->text('description')->nullable();
            $table->text('internal_notes')->nullable();
            
            // Company
            $table->unsignedBigInteger('company_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['type', 'stage_id']);
            $table->index(['user_id', 'stage_id']);
            $table->index(['team_id', 'stage_id']);
            $table->index('date_deadline');
            $table->index('expected_revenue');
        });

        // Lead-Tag pivot
        Schema::create('crm_lead_tag', function (Blueprint $table) {
            $table->foreignId('lead_id')->constrained('crm_leads')->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('crm_tags')->cascadeOnDelete();
            $table->primary(['lead_id', 'tag_id']);
        });

        // CRM Activities (tasks/follow-ups)
        Schema::create('crm_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('crm_leads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['call', 'email', 'meeting', 'task', 'deadline', 'note'])->default('task');
            $table->string('summary');
            $table->text('description')->nullable();
            $table->date('date_due');
            $table->time('time_due')->nullable();
            $table->boolean('done')->default(false);
            $table->timestamp('done_at')->nullable();
            $table->timestamps();
            
            $table->index(['lead_id', 'done', 'date_due']);
            $table->index(['user_id', 'done', 'date_due']);
        });

        // Seed default stages
        DB::table('crm_stages')->insert([
            ['name' => 'New', 'sequence' => 1, 'probability' => 10, 'is_won' => false, 'is_lost' => false, 'fold' => false, 'color' => 'gray', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Qualified', 'sequence' => 2, 'probability' => 25, 'is_won' => false, 'is_lost' => false, 'fold' => false, 'color' => 'blue', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Proposition', 'sequence' => 3, 'probability' => 50, 'is_won' => false, 'is_lost' => false, 'fold' => false, 'color' => 'yellow', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Negotiation', 'sequence' => 4, 'probability' => 75, 'is_won' => false, 'is_lost' => false, 'fold' => false, 'color' => 'orange', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Won', 'sequence' => 5, 'probability' => 100, 'is_won' => true, 'is_lost' => false, 'fold' => false, 'color' => 'green', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lost', 'sequence' => 6, 'probability' => 0, 'is_won' => false, 'is_lost' => true, 'fold' => true, 'color' => 'red', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Seed default lost reasons
        DB::table('crm_lost_reasons')->insert([
            ['name' => 'Too expensive', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Chose competitor', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'No budget', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'No response', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Not the right fit', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Timing not right', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_activities');
        Schema::dropIfExists('crm_lead_tag');
        Schema::dropIfExists('crm_leads');
        Schema::dropIfExists('crm_tags');
        Schema::dropIfExists('crm_lost_reasons');
        Schema::dropIfExists('crm_team_members');
        Schema::dropIfExists('crm_teams');
        Schema::dropIfExists('crm_stages');
    }
};
