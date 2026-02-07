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
import { usePartnerOrganizations, Organization } from '@/hooks/use-partner';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2,
    Users,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors: Record<string, string> = {
    active: 'text-green-600 border-green-500/30 bg-green-500/10',
    trial: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
    suspended: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    cancelled: 'text-red-600 border-red-500/30 bg-red-500/10',
};

const typeLabels: Record<string, string> = {
    company: 'Company',
    nonprofit: 'Non-Profit',
    government: 'Government',
    education: 'Education',
    individual: 'Individual',
};

export default function PartnerOrganizations() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('all');
    const [type, setType] = useState<string>('all');
    const [page, setPage] = useState(1);

    const { data, isLoading } = usePartnerOrganizations({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        type: type !== 'all' ? type : undefined,
        page,
    });

    const organizations = data?.data || [];
    const meta = data?.meta;

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Organizations"
                subtitle="Manage your customer organizations"
            >
                <Button asChild>
                    <Link to="/partner/organizations/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Organization
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
                                    placeholder="Search organizations..."
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
                                        <SelectItem value="trial">Trial</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="company">Company</SelectItem>
                                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                                        <SelectItem value="government">Government</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                        <SelectItem value="individual">Individual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Organizations Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
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
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : organizations.length > 0 ? (
                                    organizations.map((org, index) => (
                                        <motion.tr
                                            key={org.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate(`/partner/organizations/${org.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{org.name}</p>
                                                        <p className="text-xs text-muted-foreground">{org.code}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{typeLabels[org.type] || org.type}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {org.plan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                    <span>{org.users_count ?? 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[org.status] || ''}>
                                                    {org.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(org.created_at).toLocaleDateString()}
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
                                                            navigate(`/partner/organizations/${org.id}`);
                                                        }}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/partner/organizations/${org.id}/edit`);
                                                        }}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/partner/organizations/${org.id}/modules`);
                                                        }}>
                                                            <Settings className="w-4 h-4 mr-2" />
                                                            Manage Modules
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground">No organizations found</p>
                                            <Button variant="link" asChild className="mt-2">
                                                <Link to="/partner/organizations/new">Create your first organization</Link>
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
                                Showing {meta.from} to {meta.to} of {meta.total} organizations
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
        </DashboardLayout>
    );
}
