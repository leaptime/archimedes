import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
    ArrowLeft,
    Edit,
    Trophy,
    XCircle,
    RefreshCw,
    Target,
    Mail,
    Phone,
    Globe,
    MapPin,
    Calendar,
    User,
    Building,
    DollarSign,
    Clock,
    Plus,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { ExtensionPoint, DetailExtensionSlot } from '@/components/modules';

interface Activity {
    id: number;
    type: 'call' | 'email' | 'meeting' | 'task' | 'deadline' | 'note';
    summary: string;
    description?: string;
    date_due: string;
    time_due?: string;
    done: boolean;
    done_at?: string;
    user: { id: number; name: string };
}

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
    phone?: string;
    mobile?: string;
    website?: string;
    function?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country_code?: string;
    date_deadline?: string;
    date_open?: string;
    date_closed?: string;
    date_conversion?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    description?: string;
    internal_notes?: string;
    created_at: string;
    stage: { id: number; name: string; color?: string; is_won: boolean; is_lost: boolean };
    user?: { id: number; name: string };
    team?: { id: number; name: string };
    contact?: { id: number; name: string };
    lost_reason?: { id: number; name: string };
    tags: { id: number; name: string; color?: string }[];
    activities: Activity[];
    created_by?: { id: number; name: string };
}

interface Stage {
    id: number;
    name: string;
    is_won: boolean;
    is_lost: boolean;
}

interface LostReason {
    id: number;
    name: string;
}

const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Very High'];
const ACTIVITY_ICONS: Record<string, string> = {
    call: '📞',
    email: '✉️',
    meeting: '🤝',
    task: '✅',
    deadline: '📅',
    note: '📝',
};

export default function CrmLeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [lead, setLead] = useState<Lead | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);
    const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showLostDialog, setShowLostDialog] = useState(false);
    const [showWonDialog, setShowWonDialog] = useState(false);
    const [showActivityDialog, setShowActivityDialog] = useState(false);
    
    const [lostReasonId, setLostReasonId] = useState<string>('');
    const [lostFeedback, setLostFeedback] = useState('');
    const [wonRevenue, setWonRevenue] = useState('');
    
    const [newActivity, setNewActivity] = useState({
        type: 'task',
        summary: '',
        description: '',
        date_due: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leadRes, stagesRes, reasonsRes] = await Promise.all([
                fetch(`/api/crm/leads/${id}`),
                fetch('/api/crm/stages'),
                fetch('/api/crm/lost-reasons'),
            ]);
            
            const leadData = await leadRes.json();
            const stagesData = await stagesRes.json();
            const reasonsData = await reasonsRes.json();
            
            setLead(leadData.data);
            setStages(stagesData.data || []);
            setLostReasons(reasonsData.data || []);
        } catch (error) {
            console.error('Failed to load lead:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (stageId: string) => {
        if (stageId === 'none') return;
        await fetch(`/api/crm/leads/${id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage_id: parseInt(stageId) }),
        });
        loadData();
    };

    const handleMarkWon = async () => {
        await fetch(`/api/crm/leads/${id}/won`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual_revenue: wonRevenue ? parseFloat(wonRevenue) : null }),
        });
        setShowWonDialog(false);
        loadData();
    };

    const handleMarkLost = async () => {
        if (!lostReasonId || lostReasonId === 'none') return;
        await fetch(`/api/crm/leads/${id}/lost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lost_reason_id: parseInt(lostReasonId), feedback: lostFeedback }),
        });
        setShowLostDialog(false);
        loadData();
    };

    const handleReopen = async () => {
        await fetch(`/api/crm/leads/${id}/reopen`, { method: 'POST' });
        loadData();
    };

    const handleConvert = async () => {
        await fetch(`/api/crm/leads/${id}/convert`, { method: 'POST' });
        loadData();
    };

    const handleToggleActivity = async (activityId: number, done: boolean) => {
        if (done) {
            await fetch(`/api/crm/leads/${id}/activities/${activityId}/done`, { method: 'POST' });
        } else {
            await fetch(`/api/crm/leads/${id}/activities/${activityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: false }),
            });
        }
        loadData();
    };

    const handleCreateActivity = async () => {
        await fetch(`/api/crm/leads/${id}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newActivity),
        });
        setShowActivityDialog(false);
        setNewActivity({ type: 'task', summary: '', description: '', date_due: format(new Date(), 'yyyy-MM-dd') });
        loadData();
    };

    const formatCurrency = (amount: number) => {
        return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading || !lead) {
        return (
            <DashboardLayout>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    const isClosed = lead.stage.is_won || lead.stage.is_lost;

    return (
        <DashboardLayout>
            <DashboardHeader
                title={lead.name}
                subtitle={lead.partner_name || lead.contact_name || undefined}
                backLink={{ label: 'Back to CRM', href: '/crm' }}
            >
                <div className="flex gap-2">
                    {lead.type === 'lead' && (
                        <Button variant="outline" onClick={handleConvert}>
                            <Target className="mr-2 h-4 w-4" />
                            Convert to Opportunity
                        </Button>
                    )}
                    {!isClosed && (
                        <>
                            <Button variant="outline" className="text-green-600" onClick={() => setShowWonDialog(true)}>
                                <Trophy className="mr-2 h-4 w-4" />
                                Won
                            </Button>
                            <Button variant="outline" className="text-red-600" onClick={() => setShowLostDialog(true)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Lost
                            </Button>
                        </>
                    )}
                    {isClosed && (
                        <Button variant="outline" onClick={handleReopen}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reopen
                        </Button>
                    )}
                    <Button onClick={() => navigate(`/crm/leads/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
            </DashboardHeader>

            <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="col-span-2 space-y-6">
                        {/* Stage Pipeline */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm font-medium">Stage:</span>
                                    <Select value={lead.stage.id.toString()} onValueChange={handleStageChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id.toString()}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Badge
                                        variant={lead.stage.is_won ? 'default' : lead.stage.is_lost ? 'destructive' : 'secondary'}
                                        className={lead.stage.is_won ? 'bg-green-100 text-green-800' : ''}
                                    >
                                        {lead.probability}% probability
                                    </Badge>
                                </div>
                                
                                {/* Visual pipeline */}
                                <div className="flex gap-1">
                                    {stages.filter(s => !s.is_lost).map((stage, idx) => {
                                        const isActive = lead.stage.id === stage.id;
                                        const isPast = stages.findIndex(s => s.id === lead.stage.id) > idx;
                                        return (
                                            <div
                                                key={stage.id}
                                                className={`flex-1 h-2 rounded ${
                                                    isActive ? 'bg-primary' : isPast ? 'bg-primary/50' : 'bg-gray-200'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Expected Revenue</div>
                                        <div className="text-2xl font-bold">{formatCurrency(lead.expected_revenue)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Weighted Value</div>
                                        <div className="text-2xl font-bold text-primary">{formatCurrency(lead.weighted_revenue)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Expected Close</div>
                                        <div className="text-2xl font-bold">
                                            {lead.date_deadline ? format(new Date(lead.date_deadline), 'dd MMM yyyy') : '-'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {lead.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{lead.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Activities */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Activities
                                </CardTitle>
                                <Button size="sm" onClick={() => setShowActivityDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Schedule Activity
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {lead.activities.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No activities scheduled</p>
                                ) : (
                                    <div className="space-y-3">
                                        {lead.activities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border ${activity.done ? 'bg-gray-50' : ''}`}
                                            >
                                                <Checkbox
                                                    checked={activity.done}
                                                    onCheckedChange={(checked) => handleToggleActivity(activity.id, !!checked)}
                                                />
                                                <div className="flex-1">
                                                    <div className={`font-medium ${activity.done ? 'line-through text-muted-foreground' : ''}`}>
                                                        {ACTIVITY_ICONS[activity.type]} {activity.summary}
                                                    </div>
                                                    {activity.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                        <span>{format(new Date(activity.date_due), 'dd MMM yyyy')}</span>
                                                        <span>{activity.user.name}</span>
                                                        {activity.done && activity.done_at && (
                                                            <span className="text-green-600">
                                                                ✓ Done {format(new Date(activity.done_at), 'dd MMM')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lead.contact_name && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{lead.contact_name}</span>
                                        {lead.function && <span className="text-muted-foreground">({lead.function})</span>}
                                    </div>
                                )}
                                {lead.partner_name && (
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <span>{lead.partner_name}</span>
                                    </div>
                                )}
                                {lead.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                                    </div>
                                )}
                                {lead.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                                    </div>
                                )}
                                {lead.mobile && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${lead.mobile}`} className="text-primary hover:underline">{lead.mobile}</a>
                                    </div>
                                )}
                                {lead.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <a href={lead.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                                            {lead.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                                {(lead.street || lead.city) && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div>
                                            {lead.street && <div>{lead.street}</div>}
                                            {lead.city && <div>{[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}</div>}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Assignment */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Assignment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(lead.user?.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{lead.user?.name || 'Unassigned'}</div>
                                        <div className="text-sm text-muted-foreground">Salesperson</div>
                                    </div>
                                </div>
                                {lead.team && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Team: </span>
                                        {lead.team.name}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        {lead.tags.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {lead.tags.map((tag) => (
                                            <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Source */}
                        {(lead.source || lead.medium || lead.campaign) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Source</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {lead.source && <div><span className="text-muted-foreground">Source: </span>{lead.source}</div>}
                                    {lead.medium && <div><span className="text-muted-foreground">Medium: </span>{lead.medium}</div>}
                                    {lead.campaign && <div><span className="text-muted-foreground">Campaign: </span>{lead.campaign}</div>}
                                </CardContent>
                            </Card>
                        )}

                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div><span className="text-muted-foreground">Type: </span>
                                    <Badge variant="outline">{lead.type === 'lead' ? 'Lead' : 'Opportunity'}</Badge>
                                </div>
                                <div><span className="text-muted-foreground">Priority: </span>{PRIORITY_LABELS[lead.priority]}</div>
                                <div><span className="text-muted-foreground">Created: </span>{format(new Date(lead.created_at), 'dd MMM yyyy')}</div>
                                {lead.date_open && (
                                    <div><span className="text-muted-foreground">Assigned: </span>{format(new Date(lead.date_open), 'dd MMM yyyy')}</div>
                                )}
                                {lead.date_conversion && (
                                    <div><span className="text-muted-foreground">Converted: </span>{format(new Date(lead.date_conversion), 'dd MMM yyyy')}</div>
                                )}
                                {lead.date_closed && (
                                    <div><span className="text-muted-foreground">Closed: </span>{format(new Date(lead.date_closed), 'dd MMM yyyy')}</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Extension point for additional sidebar panels */}
                        <DetailExtensionSlot
                            name="crm.lead.detail.sidebar"
                            entity={lead}
                            onRefresh={loadLead}
                        />
                    </div>
                </div>

                {/* Extension point for full-width content below main layout */}
                <DetailExtensionSlot
                    name="crm.lead.detail.below"
                    entity={lead}
                    onRefresh={loadLead}
                    className="mt-6"
                />
            </div>

            {/* Lost Dialog */}
            <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Lost</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Lost Reason</label>
                            <Select value={lostReasonId || 'none'} onValueChange={setLostReasonId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {lostReasons.map((reason) => (
                                        <SelectItem key={reason.id} value={reason.id.toString()}>
                                            {reason.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Feedback (optional)</label>
                            <Textarea
                                value={lostFeedback}
                                onChange={(e) => setLostFeedback(e.target.value)}
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLostDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleMarkLost} disabled={!lostReasonId || lostReasonId === 'none'}>
                            Mark as Lost
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Won Dialog */}
            <Dialog open={showWonDialog} onOpenChange={setShowWonDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Won 🎉</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Actual Revenue (optional)</label>
                            <Input
                                type="number"
                                value={wonRevenue}
                                onChange={(e) => setWonRevenue(e.target.value)}
                                placeholder={lead.expected_revenue.toString()}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Leave blank to use expected revenue: {formatCurrency(lead.expected_revenue)}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWonDialog(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleMarkWon}>
                            <Trophy className="mr-2 h-4 w-4" />
                            Mark as Won
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activity Dialog */}
            <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Activity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Type</label>
                            <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="call">📞 Call</SelectItem>
                                    <SelectItem value="email">✉️ Email</SelectItem>
                                    <SelectItem value="meeting">🤝 Meeting</SelectItem>
                                    <SelectItem value="task">✅ Task</SelectItem>
                                    <SelectItem value="deadline">📅 Deadline</SelectItem>
                                    <SelectItem value="note">📝 Note</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Summary</label>
                            <Input
                                value={newActivity.summary}
                                onChange={(e) => setNewActivity({ ...newActivity, summary: e.target.value })}
                                placeholder="What needs to be done?"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Due Date</label>
                            <Input
                                type="date"
                                value={newActivity.date_due}
                                onChange={(e) => setNewActivity({ ...newActivity, date_due: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description (optional)</label>
                            <Textarea
                                value={newActivity.description}
                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowActivityDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateActivity} disabled={!newActivity.summary}>
                            Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
