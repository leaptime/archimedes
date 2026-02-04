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
    SelectField,
} from '@/components/modules';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    ArrowDownCircle,
    ArrowUpCircle,
    ArrowLeftRight,
    MoreHorizontal,
    Eye,
    CheckCircle,
    XCircle,
    Link as LinkIcon,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
    Edit,
} from 'lucide-react';

interface CashBookEntry {
    id: number;
    number: string;
    date: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency_code: string;
    payment_method: string;
    description: string;
    reference?: string;
    contact?: { id: number; name: string };
    bank_account?: { id: number; name: string };
    state: 'draft' | 'confirmed' | 'reconciled' | 'cancelled';
    amount_allocated: number;
    amount_unallocated: number;
    is_fully_allocated: boolean;
}

interface Stats {
    month: { income: number; expense: number; net: number };
    year: { income: number; expense: number; net: number };
    pending_count: number;
    unallocated_count: number;
}

const TYPE_CONFIG = {
    income: { label: 'Income', icon: ArrowDownCircle, color: 'text-green-600' },
    expense: { label: 'Expense', icon: ArrowUpCircle, color: 'text-red-600' },
    transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600' },
};

const STATE_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    reconciled: { label: 'Reconciled', variant: 'outline' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_METHODS: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    credit_card: 'Credit Card',
    direct_debit: 'Direct Debit',
    other: 'Other',
};

export default function CashBookPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [entries, setEntries] = useState<CashBookEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    const [stateFilter, setStateFilter] = useState<string | undefined>(searchParams.get('state') || undefined);
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

    useEffect(() => {
        loadData();
    }, [typeFilter, stateFilter, searchParams]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (search) params.set('search', search);
            if (stateFilter && stateFilter !== 'any') params.set('state', stateFilter);
            params.set('page', searchParams.get('page') || '1');

            const [entriesRes, statsRes] = await Promise.all([
                fetch(`/api/cashbook?${params}`),
                fetch('/api/cashbook/stats'),
            ]);

            const entriesData = await entriesRes.json();
            const statsData = await statsRes.json();

            setEntries(entriesData.data || []);
            setStats(statsData.data);
            setPagination({
                currentPage: entriesData.current_page || 1,
                lastPage: entriesData.last_page || 1,
                total: entriesData.total || 0,
            });
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }
        params.delete('page');
        setSearchParams(params);
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    const handleConfirm = async (id: number) => {
        await fetch(`/api/cashbook/${id}/confirm`, { method: 'POST' });
        loadData();
    };

    const handleCancel = async (id: number) => {
        await fetch(`/api/cashbook/${id}/cancel`, { method: 'POST' });
        loadData();
    };

    const formatCurrency = (amount: number, currency = 'EUR') => {
        const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency + ' ';
        return `${symbol}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const columns = [
        {
            key: 'number',
            label: 'Entry',
            render: (entry: CashBookEntry) => {
                const TypeIcon = TYPE_CONFIG[entry.type].icon;
                return (
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${entry.type === 'income' ? 'bg-green-100' : entry.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <TypeIcon className={`h-4 w-4 ${TYPE_CONFIG[entry.type].color}`} />
                        </div>
                        <div>
                            <div className="font-medium">{entry.number}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'description',
            label: 'Description',
            render: (entry: CashBookEntry) => (
                <div>
                    <div className="font-medium line-clamp-1">{entry.description}</div>
                    {entry.contact && (
                        <div className="text-sm text-muted-foreground">{entry.contact.name}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'payment_method',
            label: 'Method',
            render: (entry: CashBookEntry) => (
                <span className="text-sm">{PAYMENT_METHODS[entry.payment_method] || entry.payment_method}</span>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            className: 'text-right',
            render: (entry: CashBookEntry) => (
                <div className={`font-medium ${entry.type === 'income' ? 'text-green-600' : entry.type === 'expense' ? 'text-red-600' : 'text-foreground'}`}>
                    {entry.type === 'expense' ? '-' : '+'}{formatCurrency(entry.amount, entry.currency_code)}
                </div>
            ),
        },
        {
            key: 'allocation',
            label: 'Allocated',
            className: 'text-right',
            render: (entry: CashBookEntry) => {
                if (entry.type === 'transfer') return <span className="text-muted-foreground">-</span>;
                if (entry.is_fully_allocated) {
                    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Full</Badge>;
                }
                if (entry.amount_allocated > 0) {
                    const percent = Math.round((entry.amount_allocated / entry.amount) * 100);
                    return <span className="text-amber-600">{percent}%</span>;
                }
                return <span className="text-muted-foreground">None</span>;
            },
        },
        {
            key: 'state',
            label: 'Status',
            render: (entry: CashBookEntry) => (
                <Badge variant={STATE_BADGES[entry.state]?.variant || 'secondary'}>
                    {STATE_BADGES[entry.state]?.label || entry.state}
                </Badge>
            ),
        },
    ];

    const actions = (entry: CashBookEntry) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/cashbook/${entry.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                {entry.state === 'draft' && (
                    <DropdownMenuItem onClick={() => navigate(`/cashbook/${entry.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                )}
                {entry.state === 'confirmed' && !entry.is_fully_allocated && entry.type !== 'transfer' && (
                    <DropdownMenuItem onClick={() => navigate(`/cashbook/${entry.id}?action=allocate`)}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Allocate to Invoices
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {entry.state === 'draft' && (
                    <DropdownMenuItem onClick={() => handleConfirm(entry.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm
                    </DropdownMenuItem>
                )}
                {['draft', 'confirmed'].includes(entry.state) && (
                    <DropdownMenuItem onClick={() => handleCancel(entry.id)} className="text-red-600">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const statsCards = stats ? [
        {
            label: 'Month Income',
            value: formatCurrency(stats.month.income),
            icon: <TrendingUp className="h-4 w-4" />,
            trend: { value: 0, isPositive: true },
            color: 'green' as const,
        },
        {
            label: 'Month Expenses',
            value: formatCurrency(stats.month.expense),
            icon: <TrendingDown className="h-4 w-4" />,
            color: 'red' as const,
        },
        {
            label: 'Net Cash Flow',
            value: formatCurrency(stats.month.net),
            icon: stats.month.net >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
            color: stats.month.net >= 0 ? 'green' as const : 'red' as const,
        },
        {
            label: 'Pending',
            value: stats.pending_count.toString(),
            icon: <Clock className="h-4 w-4" />,
            color: stats.pending_count > 0 ? 'yellow' as const : undefined,
        },
        {
            label: 'Unallocated',
            value: stats.unallocated_count.toString(),
            icon: <AlertCircle className="h-4 w-4" />,
            color: stats.unallocated_count > 0 ? 'orange' as const : undefined,
        },
    ] : [];

    return (
        <ModulePage
            title="Cash Book"
            subtitle="Track income, expenses and invoice allocations"
            actions={
                <Button onClick={() => navigate('/cashbook/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Entry
                </Button>
            }
        >
            {/* Stats */}
            {stats && <ModuleStats stats={statsCards} columns={5} />}

            {/* Type Tabs */}
            <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="income" className="gap-1.5">
                        <ArrowDownCircle className="h-3.5 w-3.5 text-green-600" />
                        Income
                    </TabsTrigger>
                    <TabsTrigger value="expense" className="gap-1.5">
                        <ArrowUpCircle className="h-3.5 w-3.5 text-red-600" />
                        Expenses
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="gap-1.5">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
                        Transfers
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filters */}
            <ModuleFilters>
                <ModuleSearch
                    value={search}
                    onChange={handleSearch}
                    placeholder="Search entries..."
                />
                <SelectField
                    label=""
                    value={stateFilter || 'any'}
                    onChange={(v) => setStateFilter(v === 'any' ? undefined : v)}
                    options={[
                        { value: 'any', label: 'All Status' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'confirmed', label: 'Confirmed' },
                        { value: 'reconciled', label: 'Reconciled' },
                    ]}
                    className="w-40"
                />
            </ModuleFilters>

            {/* List */}
            <ModuleList
                data={entries}
                columns={columns}
                actions={actions}
                loading={loading}
                onRowClick={(entry) => navigate(`/cashbook/${entry.id}`)}
                pagination={{
                    currentPage: pagination.currentPage,
                    totalPages: pagination.lastPage,
                    totalItems: pagination.total,
                    onPageChange: handlePageChange,
                }}
                emptyState={{
                    icon: <ArrowLeftRight className="h-12 w-12" />,
                    title: 'No entries found',
                    description: typeFilter !== 'all' || stateFilter
                        ? 'Try adjusting your filters'
                        : 'Create your first cash book entry to start tracking payments',
                    action: {
                        label: 'New Entry',
                        onClick: () => navigate('/cashbook/new'),
                    },
                }}
            />
        </ModulePage>
    );
}
