import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Shield,
    Users,
    Key,
    FileText,
    Search,
    RefreshCw,
    UserPlus,
    Check,
    X,
    ChevronRight,
    Lock,
    Unlock,
    Edit,
    Info,
    ArrowLeft,
    Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { Link } from 'react-router-dom';

// Explanation boxes for each tab
function GroupsExplanation() {
    return (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">What are Permission Groups?</p>
                    <p className="text-muted-foreground">
                        Groups define roles in your system (e.g., "Contact Manager", "Invoicing User"). 
                        Users assigned to a group inherit all its permissions. Groups can also inherit 
                        from other groups - for example, a "Manager" group automatically includes 
                        all permissions from the "User" group.
                    </p>
                </div>
            </div>
        </div>
    );
}

function UsersExplanation() {
    return (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Assigning Groups to Users</p>
                    <p className="text-muted-foreground">
                        Click the edit button next to a user to assign or remove groups. 
                        When you assign a group, the user automatically gets all permissions 
                        from that group AND any groups it inherits from. For example, assigning 
                        "Contact Manager" also gives permissions from "Contact User" and "Internal User".
                    </p>
                </div>
            </div>
        </div>
    );
}

function AccessRulesExplanation() {
    return (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex gap-3">
                <Key className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Understanding Access Rules (ACL)</p>
                    <p className="text-muted-foreground">
                        Access rules define what operations each group can perform on each model. 
                        The four operations are: <strong>Read</strong> (view records), <strong>Write</strong> (edit existing), 
                        <strong>Create</strong> (add new), and <strong>Delete</strong> (remove). 
                        A checkmark means the group has that permission. These rules are defined 
                        in module manifests and loaded automatically.
                    </p>
                </div>
            </div>
        </div>
    );
}

function RecordRulesExplanation() {
    return (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex gap-3">
                <Lock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Record Rules (Row-Level Security)</p>
                    <p className="text-muted-foreground">
                        Record rules filter WHICH records a user can access, even if they have model-level permission. 
                        For example: "Users can only see their own contacts" or "Managers can see all contacts". 
                        <strong> Global</strong> rules apply to everyone, while <strong>Group-specific</strong> rules 
                        only apply to users in certain groups. The domain expression defines the filter condition.
                    </p>
                </div>
            </div>
        </div>
    );
}

interface PermissionGroup {
    id: number;
    identifier: string;
    name: string;
    module: string;
    category: string;
    description: string;
    implied: string[];
}

interface User {
    id: number;
    name: string;
    email: string;
    groups: string[];
}

interface AccessRule {
    id: number;
    identifier: string;
    name: string;
    model: string;
    group: string;
    group_name: string;
    permissions: {
        read: boolean;
        write: boolean;
        create: boolean;
        delete: boolean;
    };
    module: string;
}

interface RecordRule {
    id: number;
    identifier: string;
    name: string;
    model: string;
    domain: string;
    is_global: boolean;
    groups: string[];
    operations: string[];
    priority: number;
    module: string;
}

// API Functions
async function fetchGroups(): Promise<PermissionGroup[]> {
    const response = await axios.get('/api/permissions/groups');
    return response.data.data;
}

async function fetchAccessRules(): Promise<AccessRule[]> {
    const response = await axios.get('/api/permissions/access');
    return response.data.data;
}

async function fetchRecordRules(): Promise<RecordRule[]> {
    const response = await axios.get('/api/permissions/rules');
    return response.data.data;
}

async function fetchUsers(): Promise<User[]> {
    const response = await axios.get('/api/users');
    return response.data.data;
}

async function assignUserGroups(userId: number, groups: string[]): Promise<void> {
    await axios.post('/api/permissions/assign-groups', { user_id: userId, groups });
}

async function reloadPermissions(): Promise<any> {
    const response = await axios.post('/api/permissions/reload');
    return response.data;
}

// Components
function GroupsTab() {
    const { data: groups, isLoading } = useQuery({
        queryKey: ['permission-groups'],
        queryFn: fetchGroups,
    });

    const [search, setSearch] = useState('');

    const filteredGroups = groups?.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.identifier.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return <Skeleton className="h-64" />;
    }

    // Group by category
    const byCategory = filteredGroups?.reduce((acc, group) => {
        const cat = group.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(group);
        return acc;
    }, {} as Record<string, PermissionGroup[]>);

    return (
        <div className="space-y-4">
            <GroupsExplanation />
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {Object.entries(byCategory || {}).map(([category, categoryGroups]) => (
                <div key={category} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {category}
                    </h3>
                    <div className="grid gap-3">
                        {categoryGroups.map((group) => (
                            <div
                                key={group.id}
                                className="p-4 bg-card border border-border rounded-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{group.name}</span>
                                            <Badge variant="outline" className="text-xs font-mono">
                                                {group.identifier}
                                            </Badge>
                                        </div>
                                        {group.description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {group.description}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {group.module}
                                    </Badge>
                                </div>
                                
                                {group.implied.length > 0 && (
                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Inherits:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {group.implied.map((imp) => (
                                                <Badge key={imp} variant="outline" className="text-xs">
                                                    <ChevronRight className="w-3 h-3 mr-1" />
                                                    {imp}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function UsersTab() {
    const queryClient = useQueryClient();
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users-with-groups'],
        queryFn: fetchUsers,
    });
    const { data: groups } = useQuery({
        queryKey: ['permission-groups'],
        queryFn: fetchGroups,
    });

    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    const assignMutation = useMutation({
        mutationFn: ({ userId, groups }: { userId: number; groups: string[] }) =>
            assignUserGroups(userId, groups),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users-with-groups'] });
            toast.success('User groups updated');
            setEditingUser(null);
        },
        onError: () => {
            toast.error('Failed to update user groups');
        },
    });

    const filteredUsers = users?.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setSelectedGroups(user.groups || []);
    };

    const handleSave = () => {
        if (editingUser) {
            assignMutation.mutate({ userId: editingUser.id, groups: selectedGroups });
        }
    };

    const toggleGroup = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(g => g !== groupId)
                : [...prev, groupId]
        );
    };

    if (usersLoading) {
        return <Skeleton className="h-64" />;
    }

    return (
        <div className="space-y-4">
            <UsersExplanation />
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Groups</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.groups?.length > 0 ? (
                                        user.groups.map((g) => (
                                            <Badge key={g} variant="secondary" className="text-xs">
                                                {g.split('.').pop()}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm">No groups</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(user)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Edit User Groups Dialog */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit User Groups</DialogTitle>
                    </DialogHeader>
                    
                    {editingUser && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="font-medium">{editingUser.name}</p>
                                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {groups?.map((group) => (
                                    <div
                                        key={group.id}
                                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                                        onClick={() => toggleGroup(group.identifier)}
                                    >
                                        <Checkbox
                                            checked={selectedGroups.includes(group.identifier)}
                                            onCheckedChange={() => toggleGroup(group.identifier)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{group.name}</p>
                                            <p className="text-xs text-muted-foreground">{group.identifier}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={assignMutation.isPending}>
                            {assignMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AccessRulesTab() {
    const { data: rules, isLoading } = useQuery({
        queryKey: ['access-rules'],
        queryFn: fetchAccessRules,
    });

    const [search, setSearch] = useState('');
    const [modelFilter, setModelFilter] = useState<string>('all');

    const models = [...new Set(rules?.map(r => r.model) || [])];
    
    const filteredRules = rules?.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.model.toLowerCase().includes(search.toLowerCase());
        const matchesModel = modelFilter === 'all' || r.model === modelFilter;
        return matchesSearch && matchesModel;
    });

    // Group by model
    const byModel = filteredRules?.reduce((acc, rule) => {
        if (!acc[rule.model]) acc[rule.model] = [];
        acc[rule.model].push(rule);
        return acc;
    }, {} as Record<string, AccessRule[]>);

    if (isLoading) {
        return <Skeleton className="h-64" />;
    }

    return (
        <div className="space-y-4">
            <AccessRulesExplanation />
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search rules..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        {models.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {Object.entries(byModel || {}).map(([model, modelRules]) => (
                <div key={model} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b border-border">
                        <h3 className="font-medium">{model}</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Group</TableHead>
                                <TableHead className="text-center w-20">Read</TableHead>
                                <TableHead className="text-center w-20">Write</TableHead>
                                <TableHead className="text-center w-20">Create</TableHead>
                                <TableHead className="text-center w-20">Delete</TableHead>
                                <TableHead className="w-24">Module</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modelRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <span className="font-medium">{rule.group_name || 'Global'}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {rule.group}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {rule.permissions.read ? (
                                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {rule.permissions.write ? (
                                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {rule.permissions.create ? (
                                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {rule.permissions.delete ? (
                                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {rule.module}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ))}
        </div>
    );
}

function RecordRulesTab() {
    const { data: rules, isLoading } = useQuery({
        queryKey: ['record-rules'],
        queryFn: fetchRecordRules,
    });

    const [search, setSearch] = useState('');

    const filteredRules = rules?.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.model.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return <Skeleton className="h-64" />;
    }

    return (
        <div className="space-y-4">
            <RecordRulesExplanation />
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search rules..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="space-y-3">
                {filteredRules?.map((rule) => (
                    <div
                        key={rule.id}
                        className="p-4 bg-card border border-border rounded-lg"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                {rule.is_global ? (
                                    <Lock className="w-4 h-4 text-orange-500" />
                                ) : (
                                    <Unlock className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="font-medium">{rule.name}</span>
                                <Badge variant={rule.is_global ? 'default' : 'secondary'} className="text-xs">
                                    {rule.is_global ? 'Global' : 'Group-specific'}
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {rule.model}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {rule.module}
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Operations:</span>
                                <div className="flex gap-1">
                                    {rule.operations.map((op) => (
                                        <Badge key={op} variant="secondary" className="text-xs">
                                            {op}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {!rule.is_global && rule.groups.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Groups:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {rule.groups.map((g) => (
                                            <Badge key={g} variant="outline" className="text-xs">
                                                {g}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {rule.domain && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Domain: </span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {rule.domain}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PermissionsPage() {
    const queryClient = useQueryClient();
    const { hasGroup } = usePermissions();
    
    const reloadMutation = useMutation({
        mutationFn: reloadPermissions,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
            queryClient.invalidateQueries({ queryKey: ['access-rules'] });
            queryClient.invalidateQueries({ queryKey: ['record-rules'] });
            queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
            toast.success(`Reloaded: ${data.data.groups} groups, ${data.data.access_rules} access rules, ${data.data.record_rules} record rules`);
        },
        onError: () => {
            toast.error('Failed to reload permissions');
        },
    });

    // Check if user has admin access
    const isAdmin = hasGroup('base.group_system');

    return (
        <DashboardLayout>
            <div className="border-b border-border bg-card">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-4 mb-2">
                        <Link 
                            to="/management" 
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Management
                        </Link>
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">Permissions</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control who can access what in your system using groups, access rules, and record-level security
                    </p>
                </div>
            </div>
            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-card border border-border rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">9</p>
                                <p className="text-sm text-muted-foreground">Groups</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 bg-card border border-border rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Key className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">11</p>
                                <p className="text-sm text-muted-foreground">Access Rules</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 bg-card border border-border rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">4</p>
                                <p className="text-sm text-muted-foreground">Record Rules</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 bg-card border border-border rounded-xl flex items-center justify-center"
                    >
                        {isAdmin && (
                            <Button 
                                onClick={() => reloadMutation.mutate()}
                                disabled={reloadMutation.isPending}
                                variant="outline"
                                className="w-full"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${reloadMutation.isPending ? 'animate-spin' : ''}`} />
                                Reload from Modules
                            </Button>
                        )}
                    </motion.div>
                </div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-xl p-6"
                >
                    <Tabs defaultValue="groups">
                        <TabsList className="mb-4">
                            <TabsTrigger value="groups" className="gap-2">
                                <Shield className="w-4 h-4" />
                                Groups
                            </TabsTrigger>
                            {isAdmin && (
                                <TabsTrigger value="users" className="gap-2">
                                    <Users className="w-4 h-4" />
                                    Users
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="access" className="gap-2">
                                <Key className="w-4 h-4" />
                                Access Rules
                            </TabsTrigger>
                            <TabsTrigger value="records" className="gap-2">
                                <FileText className="w-4 h-4" />
                                Record Rules
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="groups">
                            <GroupsTab />
                        </TabsContent>
                        
                        {isAdmin && (
                            <TabsContent value="users">
                                <UsersTab />
                            </TabsContent>
                        )}

                        <TabsContent value="access">
                            <AccessRulesTab />
                        </TabsContent>

                        <TabsContent value="records">
                            <RecordRulesTab />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
