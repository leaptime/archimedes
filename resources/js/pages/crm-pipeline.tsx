import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Trophy,
    XCircle,
    User,
    Calendar,
    DollarSign,
    TrendingUp,
    Target,
    Clock,
    AlertCircle,
    Loader2,
    GripVertical,
} from 'lucide-react';
import { ExtensionPoint } from '@/components/modules';

interface Lead {
    id: number;
    name: string;
    type: 'lead' | 'opportunity';
    priority: number;
    probability: number;
    expected_revenue: number;
    weighted_revenue: number;
    currency_code: string;
    contact_name?: string;
    partner_name?: string;
    email?: string;
    date_deadline?: string;
    user?: { id: number; name: string };
    contact?: { id: number; name: string };
    tags: { id: number; name: string; color?: string }[];
}

interface Stage {
    id: number;
    name: string;
    sequence: number;
    is_won: boolean;
    is_lost: boolean;
    probability: number;
    color?: string;
    fold: boolean;
}

interface PipelineColumn {
    stage: Stage;
    leads: Lead[];
    count: number;
    total_revenue: number;
    weighted_revenue: number;
}

interface Stats {
    open_count: number;
    open_revenue: number;
    weighted_revenue: number;
    won_count: number;
    won_revenue: number;
    lost_count: number;
    win_rate: number;
    leads_count: number;
    overdue_count: number;
    closing_this_month: number;
    activities_due: number;
}

const PRIORITY_COLORS = ['gray', 'blue', 'yellow', 'red'];
const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Very High'];

const STAGE_COLORS: Record<string, string> = {
    gray: 'bg-gray-100 border-gray-300',
    blue: 'bg-blue-50 border-blue-300',
    yellow: 'bg-yellow-50 border-yellow-300',
    orange: 'bg-orange-50 border-orange-300',
    green: 'bg-green-50 border-green-300',
    red: 'bg-red-50 border-red-300',
};

export default function CrmPipeline() {
    const navigate = useNavigate();
    const [pipeline, setPipeline] = useState<PipelineColumn[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<'opportunity' | 'lead' | 'all'>('opportunity');
    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

    useEffect(() => {
        loadData();
    }, [viewType]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pipelineRes, statsRes] = await Promise.all([
                fetch(`/api/crm/pipeline?type=${viewType}`),
                fetch('/api/crm/stats'),
            ]);
            const pipelineData = await pipelineRes.json();
            const statsData = await statsRes.json();
            setPipeline(pipelineData.data || []);
            setStats(statsData.data);
        } catch (error) {
            console.error('Failed to load pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, lead: Lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, stageId: number) => {
        e.preventDefault();
        if (!draggedLead || draggedLead.stage_id === stageId) {
            setDraggedLead(null);
            return;
        }

        try {
            await fetch(`/api/crm/leads/${draggedLead.id}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage_id: stageId }),
            });
            loadData();
        } catch (error) {
            console.error('Failed to move lead:', error);
        }
        setDraggedLead(null);
    };

    const handleMarkWon = async (leadId: number) => {
        await fetch(`/api/crm/leads/${leadId}/won`, { method: 'POST' });
        loadData();
    };

    const handleMarkLost = async (leadId: number) => {
        // For simplicity, using first lost reason - in real app would show dialog
        const reasonsRes = await fetch('/api/crm/lost-reasons');
        const reasons = await reasonsRes.json();
        if (reasons.data?.length > 0) {
            await fetch(`/api/crm/leads/${leadId}/lost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lost_reason_id: reasons.data[0].id }),
            });
            loadData();
        }
    };

    const formatCurrency = (amount: number) => {
        return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader title="CRM Pipeline" subtitle="Manage your sales opportunities">
                <Button onClick={() => navigate('/crm/leads/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New {viewType === 'lead' ? 'Lead' : 'Opportunity'}
                </Button>
            </DashboardHeader>

            <div className="p-6 space-y-6">
                {/* Stats Row */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Target className="h-4 w-4" />
                                    <span className="text-xs">Open Pipeline</span>
                                </div>
                                <div className="text-2xl font-bold">{formatCurrency(stats.open_revenue)}</div>
                                <div className="text-xs text-muted-foreground">{stats.open_count} opportunities</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs">Weighted Value</span>
                                </div>
                                <div className="text-2xl font-bold">{formatCurrency(stats.weighted_revenue)}</div>
                                <div className="text-xs text-muted-foreground">Expected revenue</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-green-600 mb-1">
                                    <Trophy className="h-4 w-4" />
                                    <span className="text-xs">Won This Month</span>
                                </div>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.won_revenue)}</div>
                                <div className="text-xs text-muted-foreground">{stats.won_count} deals closed</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-xs">Win Rate</span>
                                </div>
                                <div className="text-2xl font-bold">{stats.win_rate}%</div>
                                <div className="text-xs text-muted-foreground">{stats.lost_count} lost this month</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-amber-600 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs">Closing This Month</span>
                                </div>
                                <div className="text-2xl font-bold">{formatCurrency(stats.closing_this_month)}</div>
                                <div className="text-xs text-muted-foreground">
                                    {stats.overdue_count > 0 && (
                                        <span className="text-red-500">{stats.overdue_count} overdue</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Extension point for additional stats/widgets */}
                <ExtensionPoint 
                    name="crm.pipeline.after-stats" 
                    context={{ stats, pipeline }}
                />

                {/* View Toggle */}
                <div className="flex items-center justify-between">
                    <Tabs value={viewType} onValueChange={(v) => setViewType(v as typeof viewType)}>
                        <TabsList>
                            <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
                            <TabsTrigger value="lead">Leads</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex items-center gap-2">
                        {/* Extension point for pipeline actions */}
                        <ExtensionPoint name="crm.pipeline.actions" context={{ pipeline, loadData }} />
                        <Button variant="outline" onClick={() => navigate('/crm/leads')}>
                            View as List
                        </Button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {pipeline.map((column) => (
                        <div
                            key={column.stage.id}
                            className={`flex-shrink-0 w-80 rounded-lg border-2 ${STAGE_COLORS[column.stage.color || 'gray'] || STAGE_COLORS.gray}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.stage.id)}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b bg-white/50">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold">{column.stage.name}</h3>
                                    <Badge variant="secondary">{column.count}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatCurrency(column.total_revenue)}
                                    {column.weighted_revenue !== column.total_revenue && (
                                        <span className="text-xs ml-1">
                                            ({formatCurrency(column.weighted_revenue)} weighted)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
                                {column.leads.map((lead) => (
                                    <Card
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead)}
                                        className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                                            draggedLead?.id === lead.id ? 'opacity-50' : ''
                                        }`}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <button
                                                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                                        className="font-medium text-sm hover:text-primary truncate block text-left w-full"
                                                    >
                                                        {lead.name}
                                                    </button>
                                                    {(lead.partner_name || lead.contact_name) && (
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {lead.partner_name || lead.contact_name}
                                                        </div>
                                                    )}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                                            <MoreHorizontal className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigate(`/crm/leads/${lead.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {!column.stage.is_won && !column.stage.is_lost && (
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
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Revenue */}
                                            {lead.expected_revenue > 0 && (
                                                <div className="text-sm font-medium text-green-600 mb-2">
                                                    {formatCurrency(lead.expected_revenue)}
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        ({lead.probability}%)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {lead.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {lead.tags.slice(0, 2).map((tag) => (
                                                        <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                                                            {tag.name}
                                                        </Badge>
                                                    ))}
                                                    {lead.tags.length > 2 && (
                                                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                            +{lead.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    {lead.user ? (
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="text-[10px]">
                                                                {getInitials(lead.user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <User className="h-4 w-4" />
                                                    )}
                                                </div>
                                                {lead.date_deadline && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(lead.date_deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {lead.priority > 0 && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs px-1 py-0 border-${PRIORITY_COLORS[lead.priority]}-500`}
                                                    >
                                                        {PRIORITY_LABELS[lead.priority]}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {column.leads.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No {viewType === 'lead' ? 'leads' : 'opportunities'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
