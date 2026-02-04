import { motion } from 'framer-motion';
import {
    MoreHorizontal,
    Mail,
    Shield,
    ShieldCheck,
    UserPlus,
    Crown,
    Settings,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TeamMember } from './types';

interface TeamMembersListProps {
    members: TeamMember[];
}

export function TeamMembersList({ members }: TeamMembersListProps) {
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Owner':
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                        <Crown className="w-3 h-3" />
                        Owner
                    </Badge>
                );
            case 'Admin':
                return (
                    <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Member
                    </Badge>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border"
        >
            <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="font-semibold text-foreground">Team Members</h3>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join your team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email address</label>
                                <Input placeholder="colleague@company.com" type="email" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select defaultValue="member">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button>Send Invitation</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="divide-y divide-border">
                {members.map((member, index) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{member.name}</p>
                                    {member.status === 'pending' && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
                                        >
                                            Pending
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {member.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2">
                                {member.modules.slice(0, 2).map((mod) => (
                                    <Badge key={mod} variant="secondary" className="text-xs">
                                        {mod}
                                    </Badge>
                                ))}
                                {member.modules.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{member.modules.length - 2}
                                    </Badge>
                                )}
                            </div>

                            {getRoleBadge(member.role)}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Permissions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Shield className="w-4 h-4 mr-2" />
                                        Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Member
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
