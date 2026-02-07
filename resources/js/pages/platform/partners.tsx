import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePlatformPartners, useDeletePartner } from '@/hooks/use-platform';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Handshake,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Building2,
    DollarSign,
    Percent,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const statusColors: Record<string, string> = {
    active: 'text-green-600 border-green-500/30 bg-green-500/10',
    suspended: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    terminated: 'text-red-600 border-red-500/30 bg-red-500/10',
};

const typeLabels: Record<string, string> = {
    reseller: 'Reseller',
    affiliate: 'Affiliate',
    distributor: 'Distributor',
};

export default function PlatformPartners() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('all');
    const [type, setType] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, isLoading } = usePlatformPartners({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        type: type !== 'all' ? type : undefined,
        page,
    });

    const deletePartner = useDeletePartner();

    const partners = data?.data?.data || [];
    const meta = data?.data?.meta;

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            await deletePartner.mutateAsync(deleteId);
            toast.success('Partner deleted successfully');
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete partner');
        }
    };

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Partners"
                subtitle="Manage resellers and affiliates"
            >
                <Button asChild>
                    <Link to="/platform/partners/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Partner
                    </Link>
                </Button>
            </DashboardHeader>

            <div className="p-6 space-y-6">
                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search partners..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="reseller">Reseller</SelectItem>
                                        <SelectItem value="affiliate">Affiliate</SelectItem>
                                        <SelectItem value="distributor">Distributor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Partners Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Partner</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Organizations</TableHead>
                                    <TableHead>Commission</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                                    <div>
                                                        <Skeleton className="h-4 w-32 mb-1" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : partners.length > 0 ? (
                                    partners.map((partner, index) => (
                                        <motion.tr
                                            key={partner.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate(`/platform/partners/${partner.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                        <Handshake className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{partner.name}</p>
                                                        <p className="text-xs text-muted-foreground">{partner.code}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {typeLabels[partner.type] || partner.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span>{partner.organizations_count ?? 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Percent className="w-4 h-4 text-muted-foreground" />
                                                    <span>{partner.commission_rate}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[partner.status] || ''}>
                                                    {partner.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/platform/partners/${partner.id}`);
                                                        }}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/platform/partners/${partner.id}/edit`);
                                                        }}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteId(partner.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <Handshake className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground">No partners found</p>
                                            <Button variant="link" asChild className="mt-2">
                                                <Link to="/platform/partners/new">Add your first partner</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {meta.from} to {meta.to} of {meta.total} partners
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm">
                                    Page {page} of {meta.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === meta.last_page}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Partner</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this partner? This action cannot be undone.
                            Partners with existing organizations cannot be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
