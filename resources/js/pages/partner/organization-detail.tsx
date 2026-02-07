import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePartnerOrganization, useUpdateOrganization, useEnableModule, useDisableModule } from '@/hooks/use-partner';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Building2,
    Users,
    Mail,
    Phone,
    Globe,
    MapPin,
    Calendar,
    HardDrive,
    Package,
    ArrowLeft,
    Edit,
    Pause,
    Play,
    Trash2,
    CheckCircle2,
} from 'lucide-react';

const statusColors: Record<string, string> = {
    active: 'text-green-600 border-green-500/30 bg-green-500/10',
    trial: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
    suspended: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    cancelled: 'text-red-600 border-red-500/30 bg-red-500/10',
};

// Available modules with pricing
const availableModules = [
    { id: 'core', name: 'Core', category: 'Platform', monthlyPrice: 0, yearlyPrice: 0, required: true },
    { id: 'contacts', name: 'Contacts', category: 'CRM', monthlyPrice: 0, yearlyPrice: 0, required: true },
    { id: 'crm', name: 'CRM Pipeline', category: 'Sales', monthlyPrice: 29, yearlyPrice: 290 },
    { id: 'invoicing', name: 'Invoicing', category: 'Finance', monthlyPrice: 19, yearlyPrice: 190 },
    { id: 'banking', name: 'Banking', category: 'Finance', monthlyPrice: 39, yearlyPrice: 390 },
    { id: 'cashbook', name: 'Cash Book', category: 'Finance', monthlyPrice: 15, yearlyPrice: 150 },
    { id: 'l10n_it_edi', name: 'Italian E-Invoicing', category: 'Localization', monthlyPrice: 25, yearlyPrice: 250 },
];

export default function PartnerOrganizationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');

    const { data, isLoading } = usePartnerOrganization(Number(id));
    const updateOrg = useUpdateOrganization();
    const enableModule = useEnableModule();
    const disableModule = useDisableModule();

    const organization = data?.organization;
    const stats = data?.stats;

    const handleStatusChange = async () => {
        if (!organization || !newStatus) return;
        
        try {
            await updateOrg.mutateAsync({ id: organization.id, data: { status: newStatus as any } });
            toast.success(`Organization status updated to ${newStatus}`);
            setStatusDialogOpen(false);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleModuleToggle = async (moduleId: string, isActive: boolean) => {
        if (!organization) return;
        
        const module = availableModules.find(m => m.id === moduleId);
        if (!module) return;

        try {
            if (isActive) {
                await disableModule.mutateAsync({ orgId: organization.id, moduleId });
                toast.success(`${module.name} disabled`);
            } else {
                await enableModule.mutateAsync({
                    orgId: organization.id,
                    data: {
                        module_id: moduleId,
                        monthly_price: module.monthlyPrice,
                        yearly_price: module.yearlyPrice,
                    },
                });
                toast.success(`${module.name} enabled`);
            }
        } catch (error) {
            toast.error('Failed to update module');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (!organization) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Organization not found</h2>
                        <Button asChild>
                            <Link to="/partner/organizations">Back to Organizations</Link>
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const activeModules = stats?.active_modules || [];

    return (
        <DashboardLayout>
            <DashboardHeader
                title={organization.name}
                subtitle={organization.code}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/partner/organizations">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to={`/partner/organizations/${organization.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant={organization.status === 'suspended' ? 'default' : 'outline'}
                        onClick={() => {
                            setNewStatus(organization.status === 'suspended' ? 'active' : 'suspended');
                            setStatusDialogOpen(true);
                        }}
                    >
                        {organization.status === 'suspended' ? (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Reactivate
                            </>
                        ) : (
                            <>
                                <Pause className="w-4 h-4 mr-2" />
                                Suspend
                            </>
                        )}
                    </Button>
                </div>
            </DashboardHeader>

            <div className="p-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={`mt-1 ${statusColors[organization.status]}`}>
                                        {organization.status}
                                    </Badge>
                                </div>
                                <Building2 className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Users</p>
                                    <p className="text-2xl font-bold">{stats?.users_count ?? 0}</p>
                                    <p className="text-xs text-muted-foreground">of {organization.max_users} max</p>
                                </div>
                                <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Storage</p>
                                    <p className="text-2xl font-bold">{stats?.storage_used}</p>
                                    <Progress value={stats?.storage_percentage ?? 0} className="mt-2 h-1" />
                                </div>
                                <HardDrive className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Monthly Cost</p>
                                    <p className="text-2xl font-bold">${stats?.monthly_cost ?? 0}</p>
                                    <p className="text-xs text-muted-foreground">{organization.billing_cycle}</p>
                                </div>
                                <Package className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="details" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="modules">Modules</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organization Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Type</p>
                                            <p className="font-medium capitalize">{organization.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Plan</p>
                                            <Badge variant="outline" className="capitalize">{organization.plan}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Timezone</p>
                                            <p className="font-medium">{organization.timezone}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Currency</p>
                                            <p className="font-medium">{organization.currency}</p>
                                        </div>
                                    </div>
                                    
                                    {organization.trial_ends_at && (
                                        <>
                                            <Separator />
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Trial ends: {new Date(organization.trial_ends_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{organization.email}</span>
                                    </div>
                                    {organization.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{organization.phone}</span>
                                        </div>
                                    )}
                                    {organization.owner && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                                                <p className="font-medium">{organization.owner.name}</p>
                                                <p className="text-sm text-muted-foreground">{organization.owner.email}</p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Modules Tab */}
                    <TabsContent value="modules">
                        <Card>
                            <CardHeader>
                                <CardTitle>Modules</CardTitle>
                                <CardDescription>
                                    Manage which modules are available for this organization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Module</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Monthly</TableHead>
                                            <TableHead className="text-right">Yearly</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {availableModules.map((module) => {
                                            const isActive = activeModules.includes(module.id);
                                            const isRequired = module.required;
                                            
                                            return (
                                                <TableRow key={module.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-muted-foreground" />
                                                            {module.name}
                                                            {isRequired && (
                                                                <Badge variant="outline" className="text-xs">Required</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {module.category}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {module.monthlyPrice === 0 ? (
                                                            <span className="text-green-600">Free</span>
                                                        ) : (
                                                            `$${module.monthlyPrice}`
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {module.yearlyPrice === 0 ? (
                                                            <span className="text-green-600">Free</span>
                                                        ) : (
                                                            `$${module.yearlyPrice}`
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isRequired ? (
                                                            <Badge className="bg-green-500/10 text-green-600">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Switch
                                                                checked={isActive}
                                                                onCheckedChange={() => handleModuleToggle(module.id, isActive)}
                                                                disabled={enableModule.isPending || disableModule.isPending}
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <Card>
                            <CardHeader>
                                <CardTitle>Users</CardTitle>
                                <CardDescription>
                                    {stats?.users_count ?? 0} of {organization.max_users} users
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {organization.users && organization.users.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {organization.users.map((user: any) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {user.role}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No users found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Status Change Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {newStatus === 'suspended' ? 'Suspend Organization' : 'Reactivate Organization'}
                        </DialogTitle>
                        <DialogDescription>
                            {newStatus === 'suspended'
                                ? 'This will prevent all users from accessing the organization. They will see a suspended notice when trying to log in.'
                                : 'This will restore access to all users of this organization.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={newStatus === 'suspended' ? 'destructive' : 'default'}
                            onClick={handleStatusChange}
                            disabled={updateOrg.isPending}
                        >
                            {updateOrg.isPending ? 'Updating...' : newStatus === 'suspended' ? 'Suspend' : 'Reactivate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
