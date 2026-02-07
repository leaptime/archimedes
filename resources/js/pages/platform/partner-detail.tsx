import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    usePlatformPartner,
    useUpdatePartner,
    usePartnerPayouts,
    useCreatePayout,
    useCompletePayout,
} from '@/hooks/use-platform';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Handshake,
    Building2,
    Users,
    Mail,
    Phone,
    Globe,
    MapPin,
    Percent,
    DollarSign,
    Wallet,
    ArrowLeft,
    Edit,
    Pause,
    Play,
    CheckCircle2,
    Clock,
    AlertCircle,
    CreditCard,
} from 'lucide-react';

const statusColors: Record<string, string> = {
    active: 'text-green-600 border-green-500/30 bg-green-500/10',
    suspended: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    terminated: 'text-red-600 border-red-500/30 bg-red-500/10',
    pending: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    processing: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
    completed: 'text-green-600 border-green-500/30 bg-green-500/10',
    failed: 'text-red-600 border-red-500/30 bg-red-500/10',
};

const payoutStatusIcons: Record<string, React.ElementType> = {
    pending: Clock,
    processing: Clock,
    completed: CheckCircle2,
    failed: AlertCircle,
};

export default function PlatformPartnerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');
    const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
    const [completePayoutId, setCompletePayoutId] = useState<number | null>(null);
    const [paymentRef, setPaymentRef] = useState('');

    const { data, isLoading } = usePlatformPartner(Number(id));
    const { data: payoutsData, isLoading: payoutsLoading } = usePartnerPayouts(Number(id));
    const updatePartner = useUpdatePartner();
    const createPayout = useCreatePayout();
    const completePayout = useCompletePayout();

    const partner = data?.data?.partner;
    const stats = data?.data?.stats;
    const payouts = payoutsData?.data?.data || [];

    const handleStatusChange = async () => {
        if (!partner || !newStatus) return;
        
        try {
            await updatePartner.mutateAsync({ id: partner.id, data: { status: newStatus as any } });
            toast.success(`Partner status updated to ${newStatus}`);
            setStatusDialogOpen(false);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleCreatePayout = async () => {
        if (!partner) return;
        
        try {
            await createPayout.mutateAsync(partner.id);
            toast.success('Payout created successfully');
            setPayoutDialogOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create payout');
        }
    };

    const handleCompletePayout = async () => {
        if (!partner || !completePayoutId) return;
        
        try {
            await completePayout.mutateAsync({
                partnerId: partner.id,
                payoutId: completePayoutId,
                data: paymentRef ? { payment_reference: paymentRef } : undefined,
            });
            toast.success('Payout marked as completed');
            setCompletePayoutId(null);
            setPaymentRef('');
        } catch (error) {
            toast.error('Failed to complete payout');
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

    if (!partner) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Partner not found</h2>
                        <Button asChild>
                            <Link to="/platform/partners">Back to Partners</Link>
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader
                title={partner.name}
                subtitle={partner.code}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/platform/partners">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to={`/platform/partners/${partner.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant={partner.status === 'suspended' ? 'default' : 'outline'}
                        onClick={() => {
                            setNewStatus(partner.status === 'suspended' ? 'active' : 'suspended');
                            setStatusDialogOpen(true);
                        }}
                    >
                        {partner.status === 'suspended' ? (
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={`mt-1 ${statusColors[partner.status]}`}>
                                        {partner.status}
                                    </Badge>
                                </div>
                                <Handshake className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Organizations</p>
                                    <p className="text-2xl font-bold">{stats?.total_organizations ?? 0}</p>
                                </div>
                                <Building2 className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold">{stats?.total_users ?? 0}</p>
                                </div>
                                <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Monthly Commission</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${(stats?.monthly_commission ?? 0).toLocaleString()}
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                                    <p className="text-2xl font-bold">
                                        ${(stats?.pending_payout ?? 0).toLocaleString()}
                                    </p>
                                </div>
                                <Wallet className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="details" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="organizations">Organizations</TabsTrigger>
                        <TabsTrigger value="payouts">Payouts</TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Partner Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Type</p>
                                            <p className="font-medium capitalize">{partner.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Commission Rate</p>
                                            <p className="font-medium">{partner.commission_rate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Min. Payout</p>
                                            <p className="font-medium">${partner.minimum_payout}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Currency</p>
                                            <p className="font-medium">{partner.currency}</p>
                                        </div>
                                    </div>
                                    
                                    {partner.max_organizations && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Organization Limit</p>
                                                <p className="font-medium">
                                                    {stats?.total_organizations ?? 0} / {partner.max_organizations}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{partner.email}</span>
                                    </div>
                                    {partner.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{partner.phone}</span>
                                        </div>
                                    )}
                                    {partner.website && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {partner.website}
                                            </a>
                                        </div>
                                    )}
                                    {(partner.street || partner.city) && (
                                        <>
                                            <Separator />
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                                                <div>
                                                    {partner.street && <p>{partner.street}</p>}
                                                    <p>
                                                        {[partner.city, partner.state, partner.zip].filter(Boolean).join(', ')}
                                                    </p>
                                                    <p>{partner.country}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Payout Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-muted rounded-lg">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">{partner.payout_method?.replace('_', ' ')}</p>
                                            {partner.payout_details && (
                                                <p className="text-sm text-muted-foreground">
                                                    {partner.payout_details.bank_name || partner.payout_details.paypal_email || 'Details configured'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Organizations Tab */}
                    <TabsContent value="organizations">
                        <Card>
                            <CardHeader>
                                <CardTitle>Organizations</CardTitle>
                                <CardDescription>
                                    {stats?.total_organizations ?? 0} organizations managed by this partner
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {partner.organizations && partner.organizations.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {partner.organizations.map((org: any) => (
                                                <TableRow
                                                    key={org.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => navigate(`/platform/organizations/${org.id}`)}
                                                >
                                                    <TableCell className="font-medium">{org.name}</TableCell>
                                                    <TableCell className="capitalize">{org.type}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">{org.plan}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[org.status]}>{org.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No organizations yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payouts Tab */}
                    <TabsContent value="payouts">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Payouts</CardTitle>
                                        <CardDescription>Commission payment history</CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => setPayoutDialogOpen(true)}
                                        disabled={(stats?.pending_payout ?? 0) < (partner.minimum_payout ?? 0)}
                                    >
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Create Payout
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {payoutsLoading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : payouts.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Reference</TableHead>
                                                <TableHead>Period</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Paid At</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payouts.map((payout) => {
                                                const StatusIcon = payoutStatusIcons[payout.status] || Clock;
                                                return (
                                                    <TableRow key={payout.id}>
                                                        <TableCell className="font-mono text-sm">{payout.reference}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            ${Number(payout.amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[payout.status]}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {payout.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {payout.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setCompletePayoutId(payout.id)}
                                                                >
                                                                    Mark Paid
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No payouts yet</p>
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
                            {newStatus === 'suspended' ? 'Suspend Partner' : 'Reactivate Partner'}
                        </DialogTitle>
                        <DialogDescription>
                            {newStatus === 'suspended'
                                ? 'This will prevent the partner from creating new organizations or managing existing ones.'
                                : 'This will restore full access for the partner.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={newStatus === 'suspended' ? 'destructive' : 'default'}
                            onClick={handleStatusChange}
                            disabled={updatePartner.isPending}
                        >
                            {updatePartner.isPending ? 'Updating...' : newStatus === 'suspended' ? 'Suspend' : 'Reactivate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Payout Dialog */}
            <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Payout</DialogTitle>
                        <DialogDescription>
                            Create a payout for ${(stats?.pending_payout ?? 0).toLocaleString()} in pending commission.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePayout} disabled={createPayout.isPending}>
                            {createPayout.isPending ? 'Creating...' : 'Create Payout'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Payout Dialog */}
            <Dialog open={completePayoutId !== null} onOpenChange={() => { setCompletePayoutId(null); setPaymentRef(''); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Payout</DialogTitle>
                        <DialogDescription>
                            Mark this payout as completed and paid.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment_ref">Payment Reference (optional)</Label>
                            <Input
                                id="payment_ref"
                                value={paymentRef}
                                onChange={(e) => setPaymentRef(e.target.value)}
                                placeholder="e.g., Transaction ID, Check number"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCompletePayoutId(null); setPaymentRef(''); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCompletePayout} disabled={completePayout.isPending}>
                            {completePayout.isPending ? 'Completing...' : 'Mark as Paid'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
