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
    ExtensionPoint,
    ListExtensionSlot,
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
    MoreHorizontal,
    Eye,
    Edit,
    Trophy,
    XCircle,
    RefreshCw,
    Target,
    TrendingUp,
    Clock,
    AlertCircle,
    User,
    Kanban,
} from 'lucide-react';

interface Lead {
    id: number;
    name: string;
    type: 'lead' | 'opportunity';
    priority: number;
    probability: number;
    expected_revenue: number;
    currency_code: string;
    contact_name?: string;
    partner_name?: string;
    email?: string;
    date_deadline?: string;
    created_at: string;
    stage: { id: number; name: string; color?: string; is_won: boolean; is_lost: boolean };
    user?: { id: number; name: string };
    team?: { id: number; name: string };
    tags: { id: number; name: string; color?: string }[];
}

interface Stage {
    id: number;
    name: string;
}

interface Stats {
    open_count: number;
    open_revenue: number;
    weighted_revenue: number;
    won_count: number;
    won_revenue: number;
    leads_count: number;
    overdue_count: number;
}

const PRIORITY_BADGES = [
    { label: 'Low', className: 'bg-gray-100 text-gray-700' },
    { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
    { label: 'High', className: 'bg-yellow-100 text-yellow-700' },
    { label: 'Very High', className: 'bg-red-100 text-red-700' },
];

export default function CrmLeads() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'open');
    const [stageFilter, setStageFilter] = useState(searchParams.get('stage_id') || '');
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

    useEffect(() => {
        loadData();
    }, [typeFilter, statusFilter, stageFilter, searchParams]);

    useEffect(() => {
        loadStages();
    }, []);

    const loadStages = async () => {
        try {
            const res = await fetch('/api/crm/stages');
            const data = await res.json();
            setStages(data.data || []);
        } catch (error) {
            console.error('Failed to load stages:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (stageFilter) params.set('stage_id', stageFilter);
            if (search) params.set('search', search);
            params.set('page', searchParams.get('page') || '1');

            const [leadsRes, statsRes] = await Promise.all([
                fetch(`/api/crm/leads?${params}`),
                fetch('/api/crm/stats'),
            ]);

            const leadsData = await leadsRes.json();
            const statsData = await statsRes.json();

            setLeads(leadsData.data || []);
            setStats(statsData.data);
            setPagination({
                currentPage: leadsData.current_page || 1,
                lastPage: leadsData.last_page || 1,
                total: leadsData.total || 0,
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

    const handleMarkWon = async (id: number) => {
        await fetch(`/api/crm/leads/${id}/won`, { method: 'POST' });
        loadData();
    };

    const handleMarkLost = async (id: number) => {
        const reasonsRes = await fetch('/api/crm/lost-reasons');
        const reasons = await reasonsRes.json();
        if (reasons.data?.length > 0) {
            await fetch(`/api/crm/leads/${id}/lost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lost_reason_id: reasons.data[0].id }),
            });
            loadData();
        }
    };

    const handleReopen = async (id: number) => {
        await fetch(`/api/crm/leads/${id}/reopen`, { method: 'POST' });
        loadData();
    };

    const handleConvert = async (id: number) => {
        await fetch(`/api/crm/leads/${id}/convert`, { method: 'POST' });
        loadData();
    };

    const formatCurrency = (amount: number) => {
        return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
    };

    const columns = [
        {
            key: 'name',
            label: 'Opportunity',
            render: (lead: Lead) => (
                <div>
                    <div className="font-medium">{lead.name}</div>
                    {(lead.partner_name || lead.contact_name) && (
                        <div className="text-sm text-muted-foreground">
                            {lead.partner_name || lead.contact_name}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'stage',
            label: 'Stage',
            render: (lead: Lead) => (
                <Badge
                    variant={lead.stage.is_won ? 'default' : lead.stage.is_lost ? 'destructive' : 'secondary'}
                    className={lead.stage.is_won ? 'bg-green-100 text-green-800' : ''}
                >
                    {lead.stage.name}
                </Badge>
            ),
        },
        {
            key: 'expected_revenue',
            label: 'Revenue',
            className: 'text-right',
            render: (lead: Lead) => (
                <div>
                    <div className="font-medium">{formatCurrency(lead.expected_revenue)}</div>
                    <div className="text-xs text-muted-foreground">{lead.probability}% probability</div>
                </div>
            ),
        },
        {
            key: 'user',
            label: 'Salesperson',
            render: (lead: Lead) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.user?.name || 'Unassigned'}</span>
                </div>
            ),
        },
        {
            key: 'date_deadline',
            label: 'Expected Close',
            render: (lead: Lead) => {
                if (!lead.date_deadline) return <span className="text-muted-foreground">-</span>;
                const isOverdue = new Date(lead.date_deadline) < new Date() && !lead.stage.is_won && !lead.stage.is_lost;
                return (
                    <span className={isOverdue ? 'text-red-600' : ''}>
                        {format(new Date(lead.date_deadline), 'dd MMM yyyy')}
                    </span>
                );
            },
        },
        {
            key: 'priority',
            label: 'Priority',
            render: (lead: Lead) => (
                <Badge className={PRIORITY_BADGES[lead.priority]?.className}>
                    {PRIORITY_BADGES[lead.priority]?.label}
                </Badge>
            ),
        },
    ];

    const actions = (lead: Lead) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/crm/leads/${lead.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/crm/leads/${lead.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                {lead.type === 'lead' && (
                    <DropdownMenuItem onClick={() => handleConvert(lead.id)}>
                        <Target className="mr-2 h-4 w-4" />
                        Convert to Opportunity
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {!lead.stage.is_won && !lead.stage.is_lost && (
                    <>
                        <DropdownMenuItem onClick={() => handleMarkWon(lead.id)}>
                            <Trophy className="mr-2 h-4 w-4 text-green-600" />
                            Mark as Won
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkLost(lead.id)}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Mark as Lost
                        </DropdownMenuItem>
                    </>
                )}
                {(lead.stage.is_won || lead.stage.is_lost) && (
                    <DropdownMenuItem onClick={() => handleReopen(lead.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reopen
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const statsCards = stats ? [
        {
            label: 'Open Pipeline',
            value: formatCurrency(stats.open_revenue),
            icon: <Target className="h-4 w-4" />,
            description: `${stats.open_count} opportunities`,
        },
        {
            label: 'Weighted Value',
            value: formatCurrency(stats.weighted_revenue),
            icon: <TrendingUp className="h-4 w-4" />,
        },
        {
            label: 'Won This Month',
            value: formatCurrency(stats.won_revenue),
            icon: <Trophy className="h-4 w-4" />,
            color: 'green' as const,
            description: `${stats.won_count} deals`,
        },
        {
            label: 'Leads to Qualify',
            value: stats.leads_count.toString(),
            icon: <Clock className="h-4 w-4" />,
            color: stats.leads_count > 0 ? 'yellow' as const : undefined,
        },
        {
            label: 'Overdue',
            value: stats.overdue_count.toString(),
            icon: <AlertCircle className="h-4 w-4" />,
            color: stats.overdue_count > 0 ? 'red' as const : undefined,
        },
    ] : [];

    return (
        <ModulePage
            title="Leads & Opportunities"
            subtitle="Manage your sales pipeline"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/crm')}>
                        <Kanban className="mr-2 h-4 w-4" />
                        Pipeline View
                    </Button>
                    <Button onClick={() => navigate('/crm/leads/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New
                    </Button>
                </div>
            }
        >
            {stats && <ModuleStats stats={statsCards} columns={5} />}

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="won">Won</TabsTrigger>
                    <TabsTrigger value="lost">Lost</TabsTrigger>
                </TabsList>
            </Tabs>

            <ModuleFilters>
                <ModuleSearch
                    value={search}
                    onChange={handleSearch}
                    placeholder="Search leads..."
                />
                <SelectField
                    label=""
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'lead', label: 'Leads' },
                        { value: 'opportunity', label: 'Opportunities' },
                    ]}
                    className="w-36"
                />
                <SelectField
                    label=""
                    value={stageFilter || 'any'}
                    onChange={(v) => setStageFilter(v === 'any' ? '' : v)}
                    options={[
                        { value: 'any', label: 'All Stages' },
                        ...stages.map((s) => ({ value: s.id.toString(), label: s.name })),
                    ]}
                    className="w-36"
                />
                {/* Extension point for additional filters from other modules */}
                <ExtensionPoint name="crm.list.filters" context={{ typeFilter, stageFilter, statusFilter }} />
            </ModuleFilters>

            {/* Extension point for bulk actions above the list */}
            <ListExtensionSlot 
                name="crm.list.bulk-actions" 
                items={leads} 
                onRefresh={loadData}
            />

            <ModuleList
                data={leads}
                columns={columns}
                actions={actions}
                loading={loading}
                onRowClick={(lead) => navigate(`/crm/leads/${lead.id}`)}
                pagination={{
                    currentPage: pagination.currentPage,
                    totalPages: pagination.lastPage,
                    totalItems: pagination.total,
                    onPageChange: handlePageChange,
                }}
                emptyState={{
                    icon: <Target className="h-12 w-12" />,
                    title: 'No leads found',
                    description: 'Create your first lead to start building your pipeline',
                    action: {
                        label: 'New Lead',
                        onClick: () => navigate('/crm/leads/new'),
                    },
                }}
            />

            {/* Extension point for additional content below the list */}
            <ExtensionPoint name="crm.list.below" context={{ leads, stats, onRefresh: loadData }} />
        </ModulePage>
    );
}
