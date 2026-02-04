<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Core\Models\PermissionGroup;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    protected $signature = 'users:create-test {email} {--group=* : Groups to assign}';
    protected $description = 'Create a test user with specific groups';

    public function handle(): int
    {
        $email = $this->argument('email');
        $groups = $this->option('group');

        // Create or get user
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Test User',
                'password' => Hash::make('password123'),
            ]
        );

        $this->info("User: {$user->email} (password: password123)");

        // Assign groups
        if (!empty($groups)) {
            $groupIds = PermissionGroup::whereIn('identifier', $groups)->pluck('id');
            $user->permissionGroups()->sync($groupIds);
            
            $this->info("Assigned groups: " . implode(', ', $groups));
        }

        // Show effective groups (including implied)
        $allGroups = app(\Modules\Core\Services\PermissionService::class)->getUserGroupIds($user);
        $groupNames = PermissionGroup::whereIn('id', $allGroups)->pluck('identifier')->toArray();
        
        $this->newLine();
        $this->info("Effective groups (including inherited):");
        foreach ($groupNames as $name) {
            $this->line("  - {$name}");
        }

        return Command::SUCCESS;
    }
}
