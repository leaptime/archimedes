import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus,
    Search,
    MoreHorizontal,
    FileText,
    Send,
    Copy,
    Trash2,
    Eye,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    Download,
} from 'lucide-react';

interface Invoice {
    id: number;
    number: string;
    move_type: string;
    state: string;
    payment_state: string;
    contact: {
        id: number;
        name: string;
        company?: string;
    };
    invoice_date: string;
    invoice_date_due: string;
    amount_total: number;
    amount_residual: number;
    currency?: {
        code: string;
        symbol: string;
    };
}

interface Stats {
    total_count: number;
    draft_count: number;
    posted_count: number;
    paid_count: number;
    overdue_count: number;
    total_amount: number;
    outstanding_amount: number;
    overdue_amount: number;
}

const MOVE_TYPE_LABELS: Record<string, string> = {
    out_invoice: 'Invoice',
    out_refund: 'Credit Note',
    in_invoice: 'Bill',
    in_refund: 'Refund',
};

const STATE_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    posted: { label: 'Posted', variant: 'default' },
    cancel: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_STATE_BADGES: Record<string, { label: string; className: string }> = {
    not_paid: { label: 'Not Paid', className: 'bg-yellow-100 text-yellow-800' },
    partial: { label: 'Partial', className: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    in_payment: { label: 'In Payment', className: 'bg-purple-100 text-purple-800' },
    reversed: { label: 'Reversed', className: 'bg-gray-100 text-gray-800' },
};

export default function InvoicesPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'sale');
    const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
    const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment_state') || '');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
    });

    useEffect(() => {
        loadInvoices();
        loadStats();
    }, [typeFilter, stateFilter, paymentFilter, searchParams]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('type', typeFilter);
            if (search) params.set('search', search);
            if (stateFilter) params.set('state', stateFilter);
            if (paymentFilter) params.set('payment_state', paymentFilter);
            params.set('page', searchParams.get('page') || '1');

            const response = await fetch(`/api/invoices?${params}`);
            const data = await response.json();
            setInvoices(data.data || []);
            setPagination({
                currentPage: data.meta?.current_page || 1,
                lastPage: data.meta?.last_page || 1,
                total: data.meta?.total || 0,
            });
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`/api/invoices/stats?type=${typeFilter}`);
            const data = await response.json();
            setStats(data.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search) {
            params.set('search', search);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        setSearchParams(params);
        loadInvoices();
    };

    const handleAction = async (invoice: Invoice, action: string) => {
        try {
            if (action === 'view') {
                navigate(`/invoices/${invoice.id}`);
                return;
            }
            if (action === 'edit') {
                navigate(`/invoices/${invoice.id}/edit`);
                return;
            }

            const response = await fetch(`/api/invoices/${invoice.id}/${action}`, {
                method: 'POST',
            });

            if (response.ok) {
                loadInvoices();
                loadStats();
            }
        } catch (error) {
            console.error(`Failed to ${action} invoice:`, error);
        }
    };

    const handleDelete = async (invoice: Invoice) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                loadInvoices();
                loadStats();
            }
        } catch (error) {
            console.error('Failed to delete invoice:', error);
        }
    };

    const formatCurrency = (amount: number, currency?: { symbol: string }) => {
        const symbol = currency?.symbol || '$';
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isOverdue = (invoice: Invoice) => {
        return invoice.state === 'posted' &&
            invoice.payment_state !== 'paid' &&
            new Date(invoice.invoice_date_due) < new Date();
    };

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {typeFilter === 'sale' ? 'Invoices' : 'Bills'}
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your {typeFilter === 'sale' ? 'customer invoices' : 'vendor bills'}
                        </p>
                    </div>
                    <Button onClick={() => navigate('/invoices/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New {typeFilter === 'sale' ? 'Invoice' : 'Bill'}
                    </Button>
                </div>

                {/* Type Tabs */}
                <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                    <TabsList>
                        <TabsTrigger value="sale" className="gap-2">
                            <ArrowUpRight className="h-4 w-4" />
                            Sales
                        </TabsTrigger>
                        <TabsTrigger value="purchase" className="gap-2">
                            <ArrowDownLeft className="h-4 w-4" />
                            Purchases
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.total_count} {typeFilter === 'sale' ? 'invoices' : 'bills'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Draft</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.draft_count}</div>
                                <p className="text-xs text-muted-foreground">Pending confirmation</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.outstanding_amount)}</div>
                                <p className="text-xs text-muted-foreground">Awaiting payment</p>
                            </CardContent>
                        </Card>
                        <Card className={stats.overdue_count > 0 ? 'border-red-200' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                <AlertCircle className={`h-4 w-4 ${stats.overdue_count > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stats.overdue_count > 0 ? 'text-red-600' : ''}`}>
                                    {formatCurrency(stats.overdue_amount)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.overdue_count} overdue
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search invoices..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64 pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </form>

                    <Select value={stateFilter} onValueChange={setStateFilter}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="All States" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All States</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="posted">Posted</SelectItem>
                            <SelectItem value="cancel">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Payment Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Payments</SelectItem>
                            <SelectItem value="not_paid">Not Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>{typeFilter === 'sale' ? 'Customer' : 'Vendor'}</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Due</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        No {typeFilter === 'sale' ? 'invoices' : 'bills'} found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {invoice.move_type.includes('refund') && (
                                                    <Badge variant="outline" className="text-xs">CN</Badge>
                                                )}
                                                {invoice.number || 'Draft'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{invoice.contact?.name}</div>
                                                {invoice.contact?.company && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {invoice.contact.company}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {invoice.invoice_date && format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : ''}>
                                                {invoice.invoice_date_due && format(new Date(invoice.invoice_date_due), 'MMM d, yyyy')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={STATE_BADGES[invoice.state]?.variant || 'secondary'}>
                                                {STATE_BADGES[invoice.state]?.label || invoice.state}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {invoice.state === 'posted' && (
                                                <Badge className={PAYMENT_STATE_BADGES[invoice.payment_state]?.className}>
                                                    {PAYMENT_STATE_BADGES[invoice.payment_state]?.label || invoice.payment_state}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(invoice.amount_total, invoice.currency)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {invoice.amount_residual > 0 && (
                                                <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : ''}>
                                                    {formatCurrency(invoice.amount_residual, invoice.currency)}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleAction(invoice, 'view')}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </DropdownMenuItem>
                                                    {invoice.state === 'draft' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleAction(invoice, 'edit')}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAction(invoice, 'post')}>
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Confirm
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {invoice.state === 'posted' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleAction(invoice, 'send')}>
                                                                <Send className="mr-2 h-4 w-4" />
                                                                Send
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}?action=payment`)}>
                                                                <DollarSign className="mr-2 h-4 w-4" />
                                                                Register Payment
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleAction(invoice, 'duplicate')}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {invoice.state !== 'cancel' && invoice.payment_state === 'not_paid' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(invoice, 'cancel')}
                                                            className="text-destructive"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(invoice.state === 'draft' || invoice.state === 'cancel') && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(invoice)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {invoices.length} of {pagination.total} results
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === 1}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set('page', String(pagination.currentPage - 1));
                                    setSearchParams(params);
                                }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage === pagination.lastPage}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set('page', String(pagination.currentPage + 1));
                                    setSearchParams(params);
                                }}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
