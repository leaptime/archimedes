import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ModulePage,
    ModuleStats,
    ModuleList,
    ModuleFilters,
    ModuleSearch,
    ModuleEmptyState,
    SelectField,
    ExtensionPoint,
    ListExtensionSlot,
    type Column,
    type Action,
    type StatCard,
} from '@/components/modules';
import {
    Plus,
    FileText,
    Send,
    Copy,
    Trash2,
    Eye,
    DollarSign,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
} from 'lucide-react';

interface Invoice {
    id: number;
    number: string;
    move_type: string;
    state: string;
    payment_state: string;
    contact: { id: number; name: string; };
    invoice_date: string;
    invoice_date_due: string;
    amount_total: number;
    amount_residual: number;
    currency?: { code: string; symbol: string; };
}

interface Stats {
    total_count: number;
    draft_count: number;
    overdue_count: number;
    total_amount: number;
    outstanding_amount: number;
    overdue_amount: number;
}

const STATE_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    posted: { label: 'Posted', variant: 'default' },
    cancel: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_BADGES: Record<string, { label: string; className: string }> = {
    not_paid: { label: 'Not Paid', className: 'bg-yellow-100 text-yellow-800' },
    partial: { label: 'Partial', className: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
};

export default function InvoicesPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'sale');
    const [stateFilter, setStateFilter] = useState<string | undefined>(searchParams.get('state') || undefined);
    const [paymentFilter, setPaymentFilter] = useState<string | undefined>(searchParams.get('payment_state') || undefined);
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

    useEffect(() => {
        loadData();
    }, [typeFilter, stateFilter, paymentFilter, searchParams]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('type', typeFilter);
            if (search) params.set('search', search);
            if (stateFilter) params.set('state', stateFilter);
            if (paymentFilter) params.set('payment_state', paymentFilter);
            params.set('page', searchParams.get('page') || '1');

            const [invoicesRes, statsRes] = await Promise.all([
                fetch(`/api/invoices?${params}`),
                fetch(`/api/invoices/stats?type=${typeFilter}`),
            ]);

            const invoicesData = await invoicesRes.json();
            const statsData = await statsRes.json();

            setInvoices(invoicesData.data || []);
            setPagination({
                currentPage: invoicesData.meta?.current_page || 1,
                lastPage: invoicesData.meta?.last_page || 1,
                total: invoicesData.meta?.total || 0,
            });
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | string | undefined | null, currency?: { symbol: string }) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
        return `${currency?.symbol || '$'}${(isNaN(num) ? 0 : num).toFixed(2)}`;
    };

    // Stats cards configuration
    const statCards: StatCard[] = stats ? [
        {
            title: 'Total',
            value: formatCurrency(stats.total_amount),
            subtitle: `${stats.total_count ?? 0} invoices`,
            icon: <FileText className="h-4 w-4" />,
        },
        {
            title: 'Draft',
            value: (stats.draft_count ?? 0).toString(),
            subtitle: 'Pending confirmation',
            icon: <Clock className="h-4 w-4" />,
        },
        {
            title: 'Outstanding',
            value: formatCurrency(stats.outstanding_amount),
            subtitle: 'Awaiting payment',
            icon: <DollarSign className="h-4 w-4" />,
        },
        {
            title: 'Overdue',
            value: formatCurrency(stats.overdue_amount),
            subtitle: `${stats.overdue_count ?? 0} overdue`,
            icon: <AlertCircle className="h-4 w-4" />,
            variant: (stats.overdue_count ?? 0) > 0 ? 'danger' : 'default',
        },
    ] : [];

    // Table columns configuration
    const columns: Column<Invoice>[] = [
        {
            key: 'number',
            header: 'Number',
            render: (inv) => (
                <span className="font-medium">{inv.number || 'Draft'}</span>
            ),
        },
        {
            key: 'contact',
            header: 'Customer',
            render: (inv) => inv.contact?.name || '-',
        },
        {
            key: 'invoice_date',
            header: 'Date',
            render: (inv) => inv.invoice_date ? format(new Date(inv.invoice_date), 'MMM d, yyyy') : '-',
        },
        {
            key: 'invoice_date_due',
            header: 'Due Date',
            render: (inv) => inv.invoice_date_due ? format(new Date(inv.invoice_date_due), 'MMM d, yyyy') : '-',
        },
        {
            key: 'state',
            header: 'Status',
            render: (inv) => {
                const config = STATE_BADGES[inv.state];
                return config ? <Badge variant={config.variant}>{config.label}</Badge> : inv.state;
            },
        },
        {
            key: 'payment_state',
            header: 'Payment',
            render: (inv) => {
                if (inv.state !== 'posted') return null;
                const config = PAYMENT_BADGES[inv.payment_state];
                return config ? <Badge className={config.className}>{config.label}</Badge> : null;
            },
        },
        {
            key: 'amount_total',
            header: 'Total',
            className: 'text-right',
            render: (inv) => formatCurrency(inv.amount_total, inv.currency),
        },
        {
            key: 'amount_residual',
            header: 'Due',
            className: 'text-right',
            render: (inv) => inv.amount_residual > 0 ? formatCurrency(inv.amount_residual, inv.currency) : '-',
        },
    ];

    // Row actions configuration
    const actions: Action<Invoice>[] = [
        {
            label: 'View',
            icon: <Eye className="h-4 w-4" />,
            onClick: (inv) => navigate(`/invoices/${inv.id}`),
        },
        {
            label: 'Send',
            icon: <Send className="h-4 w-4" />,
            onClick: (inv) => console.log('Send', inv.id),
            hidden: (inv) => inv.state !== 'posted',
        },
        {
            label: 'Duplicate',
            icon: <Copy className="h-4 w-4" />,
            onClick: (inv) => console.log('Duplicate', inv.id),
        },
        {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (inv) => console.log('Delete', inv.id),
            variant: 'destructive',
            separator: true,
            hidden: (inv) => inv.state !== 'draft',
        },
    ];

    const isSales = typeFilter === 'sale';
    const hasFilters = !!stateFilter || !!paymentFilter || !!search;

    return (
        <ModulePage
            title={isSales ? 'Invoices' : 'Bills'}
            subtitle={`Manage your ${isSales ? 'customer invoices' : 'vendor bills'}`}
            actions={
                <Button onClick={() => navigate('/invoices/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New {isSales ? 'Invoice' : 'Bill'}
                </Button>
            }
        >
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
            <ModuleStats stats={statCards} columns={4} loading={loading && !stats} />

            {/* Filters */}
            <ModuleFilters
                hasActiveFilters={hasFilters}
                onClear={() => {
                    setSearch('');
                    setStateFilter(undefined);
                    setPaymentFilter(undefined);
                }}
            >
                <ModuleSearch
                    value={search}
                    onChange={setSearch}
                    onSearch={loadData}
                    placeholder="Search invoices..."
                    className="w-64"
                />
                <SelectField
                    name="state"
                    value={stateFilter}
                    onChange={setStateFilter}
                    options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'posted', label: 'Posted' },
                        { value: 'cancel', label: 'Cancelled' },
                    ]}
                    placeholder="All States"
                    clearLabel="All States"
                    className="w-40"
                />
                <SelectField
                    name="payment"
                    value={paymentFilter}
                    onChange={setPaymentFilter}
                    options={[
                        { value: 'not_paid', label: 'Not Paid' },
                        { value: 'partial', label: 'Partial' },
                        { value: 'paid', label: 'Paid' },
                    ]}
                    placeholder="All Payments"
                    clearLabel="All Payments"
                    className="w-40"
                />
                {/* Extension point for additional filters (e.g., Italian EDI status) */}
                <ExtensionPoint 
                    name="invoices.list.filters" 
                    context={{ typeFilter, stateFilter, paymentFilter }}
                />
            </ModuleFilters>

            {/* Extension point for bulk actions */}
            <ListExtensionSlot
                name="invoices.list.bulk-actions"
                items={invoices}
                onRefresh={loadData}
            />

            {/* Invoice List */}
            <ModuleList
                data={invoices}
                columns={columns}
                actions={actions}
                keyField="id"
                loading={loading}
                emptyMessage={hasFilters ? 'No invoices match your filters' : 'No invoices yet'}
                emptyIcon={<FileText className="h-12 w-12" />}
                onRowClick={(inv) => navigate(`/invoices/${inv.id}`)}
                pagination={{
                    ...pagination,
                    onPageChange: (page) => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', page.toString());
                        setSearchParams(params);
                    },
                }}
            />
        </ModulePage>
    );
}
