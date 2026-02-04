import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Users, Folder, Settings, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { TeamMember, TeamGroup } from './types';
import { cn } from '@/lib/utils';

interface TeamGroupsProps {
    groups: TeamGroup[];
    members: TeamMember[];
    availableModules: string[];
}

const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
    green: { bg: 'bg-green-500/20', text: 'text-green-500' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-500' },
    pink: { bg: 'bg-pink-500/20', text: 'text-pink-500' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-500' },
};

export function TeamGroups({ groups, members, availableModules }: TeamGroupsProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', color: 'blue' });
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);

    const colorOptions = [
        { name: 'blue', class: 'bg-blue-500' },
        { name: 'green', class: 'bg-green-500' },
        { name: 'purple', class: 'bg-purple-500' },
        { name: 'orange', class: 'bg-orange-500' },
        { name: 'pink', class: 'bg-pink-500' },
        { name: 'cyan', class: 'bg-cyan-500' },
    ];

    const getGroupMembers = (group: TeamGroup) => {
        return members.filter((m) => group.memberIds.includes(m.id));
    };

    const toggleMember = (memberId: number) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
        );
    };

    const toggleModule = (module: string) => {
        setSelectedModules((prev) =>
            prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
        );
    };

    return (
        <div className="space-y-6">
            {/* Groups Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-foreground">Groups</h3>
                    <p className="text-sm text-muted-foreground">
                        Organize team members into groups for easier permission management
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create New Group</DialogTitle>
                            <DialogDescription>
                                Create a group to manage permissions for multiple team members at once.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                <Label>Group Name</Label>
                                <Input
                                    placeholder="e.g., Sales Team"
                                    value={newGroup.name}
                                    onChange={(e) =>
                                        setNewGroup({ ...newGroup, name: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Brief description of this group"
                                    value={newGroup.description}
                                    onChange={(e) =>
                                        setNewGroup({ ...newGroup, description: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Group Color</Label>
                                <div className="flex gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() =>
                                                setNewGroup({ ...newGroup, color: color.name })
                                            }
                                            className={cn(
                                                'w-8 h-8 rounded-full transition-all',
                                                color.class,
                                                newGroup.color === color.name &&
                                                    'ring-2 ring-offset-2 ring-primary'
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Add Members</Label>
                                <div className="border border-border rounded-lg divide-y divide-border max-h-40 overflow-y-auto">
                                    {members.map((member) => (
                                        <label
                                            key={member.id}
                                            className="flex items-center gap-3 p-3 hover:bg-accent/30 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={selectedMembers.includes(member.id)}
                                                onCheckedChange={() => toggleMember(member.id)}
                                            />
                                            <span className="text-sm">{member.name}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {member.email}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Module Access</Label>
                                <div className="flex flex-wrap gap-2">
                                    {availableModules.map((module) => (
                                        <Badge
                                            key={module}
                                            variant={
                                                selectedModules.includes(module)
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="cursor-pointer transition-colors"
                                            onClick={() => toggleModule(module)}
                                        >
                                            {module}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setIsCreateOpen(false)}>Create Group</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group, index) => {
                    const groupMembers = getGroupMembers(group);
                    const colors = colorClasses[group.color] || colorClasses.blue;
                    return (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-lg flex items-center justify-center',
                                            colors.bg
                                        )}
                                    >
                                        <Folder className={cn('w-5 h-5', colors.text)} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground">{group.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {group.description}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit Group
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Manage Permissions
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Group
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {groupMembers.length} member
                                    {groupMembers.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex -space-x-2 ml-auto">
                                    {groupMembers.slice(0, 3).map((member) => (
                                        <img
                                            key={member.id}
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-6 h-6 rounded-full border-2 border-card"
                                        />
                                    ))}
                                    {groupMembers.length > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card">
                                            +{groupMembers.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {group.modules.slice(0, 3).map((mod) => (
                                    <Badge key={mod} variant="secondary" className="text-xs">
                                        {mod}
                                    </Badge>
                                ))}
                                {group.modules.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{group.modules.length - 3}
                                    </Badge>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
