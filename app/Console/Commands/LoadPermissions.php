<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Core\Services\PermissionLoader;
use Modules\Core\Models\PermissionGroup;
use App\Models\User;

class LoadPermissions extends Command
{
    protected $signature = 'permissions:load {--assign-admin : Assign first user to system admin group}';
    protected $description = 'Load permissions from module manifests';

    public function handle(PermissionLoader $loader): int
    {
        $this->info('Loading permissions from modules...');
        
        $stats = $loader->loadAll();
        
        $this->info("Loaded:");
        $this->line("  - {$stats['groups']} groups");
        $this->line("  - {$stats['access_rules']} access rules");
        $this->line("  - {$stats['record_rules']} record rules");

        // Optionally assign first user to admin
        if ($this->option('assign-admin')) {
            $user = User::first();
            $adminGroup = PermissionGroup::where('identifier', 'base.group_system')->first();
            
            if ($user && $adminGroup) {
                $user->permissionGroups()->syncWithoutDetaching([$adminGroup->id]);
                $this->info("Assigned user '{$user->email}' to system admin group.");
            }
        }

        // Show all groups
        $this->newLine();
        $this->info('Available groups:');
        $groups = PermissionGroup::orderBy('identifier')->get();
        foreach ($groups as $group) {
            $implied = $group->impliedGroups->pluck('identifier')->join(', ');
            $this->line("  - {$group->identifier} ({$group->name})" . ($implied ? " → implies: {$implied}" : ''));
        }

        return Command::SUCCESS;
    }
}
