import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';

interface Stage {
    id: number;
    name: string;
}

interface Team {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    name: string;
    color?: string;
}

interface FormData {
    name: string;
    type: 'lead' | 'opportunity';
    priority: number;
    stage_id: string;
    user_id: string;
    team_id: string;
    contact_name: string;
    partner_name: string;
    email: string;
    phone: string;
    mobile: string;
    website: string;
    function: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country_code: string;
    expected_revenue: string;
    currency_code: string;
    date_deadline: string;
    source: string;
    medium: string;
    campaign: string;
    description: string;
    internal_notes: string;
    tag_ids: number[];
}

const INITIAL_FORM: FormData = {
    name: '',
    type: 'opportunity',
    priority: 0,
    stage_id: '',
    user_id: '',
    team_id: '',
    contact_name: '',
    partner_name: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    function: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country_code: '',
    expected_revenue: '',
    currency_code: 'EUR',
    date_deadline: '',
    source: '',
    medium: '',
    campaign: '',
    description: '',
    internal_notes: '',
    tag_ids: [],
};

export default function CrmLeadForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    
    const [form, setForm] = useState<FormData>(INITIAL_FORM);
    const [stages, setStages] = useState<Stage[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        loadReferenceData();
        if (isEdit) {
            loadLead();
        } else {
            setLoading(false);
        }
    }, [id]);

    const loadReferenceData = async () => {
        try {
            const [stagesRes, teamsRes, tagsRes] = await Promise.all([
                fetch('/api/crm/stages'),
                fetch('/api/crm/teams'),
                fetch('/api/crm/tags'),
            ]);
            
            const stagesData = await stagesRes.json();
            const teamsData = await teamsRes.json();
            const tagsData = await tagsRes.json();
            
            setStages(stagesData.data || []);
            setTeams(teamsData.data || []);
            setTags(tagsData.data || []);
        } catch (error) {
            console.error('Failed to load reference data:', error);
        }
    };

    const loadLead = async () => {
        try {
            const res = await fetch(`/api/crm/leads/${id}`);
            const data = await res.json();
            const lead = data.data;
            
            setForm({
                name: lead.name || '',
                type: lead.type || 'opportunity',
                priority: lead.priority || 0,
                stage_id: lead.stage_id?.toString() || '',
                user_id: lead.user_id?.toString() || '',
                team_id: lead.team_id?.toString() || '',
                contact_name: lead.contact_name || '',
                partner_name: lead.partner_name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                mobile: lead.mobile || '',
                website: lead.website || '',
                function: lead.function || '',
                street: lead.street || '',
                city: lead.city || '',
                state: lead.state || '',
                zip: lead.zip || '',
                country_code: lead.country_code || '',
                expected_revenue: lead.expected_revenue?.toString() || '',
                currency_code: lead.currency_code || 'EUR',
                date_deadline: lead.date_deadline || '',
                source: lead.source || '',
                medium: lead.medium || '',
                campaign: lead.campaign || '',
                description: lead.description || '',
                internal_notes: lead.internal_notes || '',
                tag_ids: lead.tags?.map((t: Tag) => t.id) || [],
            });
        } catch (error) {
            console.error('Failed to load lead:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const payload = {
                ...form,
                stage_id: form.stage_id ? parseInt(form.stage_id) : null,
                user_id: form.user_id ? parseInt(form.user_id) : null,
                team_id: form.team_id ? parseInt(form.team_id) : null,
                expected_revenue: form.expected_revenue ? parseFloat(form.expected_revenue) : 0,
            };

            const res = await fetch(isEdit ? `/api/crm/leads/${id}` : '/api/crm/leads', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                if (error.errors) {
                    setErrors(error.errors);
                }
                return;
            }

            const data = await res.json();
            navigate(`/crm/leads/${data.data.id}`);
        } catch (error) {
            console.error('Failed to save lead:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof FormData, value: string | number | number[]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
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
            <form onSubmit={handleSubmit}>
                <DashboardHeader
                    title={isEdit ? 'Edit Lead' : 'New Lead'}
                    backLink={{ label: 'Back to CRM', href: '/crm' }}
                >
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </DashboardHeader>

                <div className="p-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            {/* Basic Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Label htmlFor="name">Opportunity Name *</Label>
                                            <Input
                                                id="name"
                                                value={form.name}
                                                onChange={(e) => updateField('name', e.target.value)}
                                                placeholder="e.g., Software License Deal"
                                                required
                                            />
                                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name[0]}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="type">Type</Label>
                                            <Select value={form.type} onValueChange={(v) => updateField('type', v as 'lead' | 'opportunity')}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="lead">Lead</SelectItem>
                                                    <SelectItem value="opportunity">Opportunity</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select value={form.priority.toString()} onValueChange={(v) => updateField('priority', parseInt(v))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">Low</SelectItem>
                                                    <SelectItem value="1">Medium</SelectItem>
                                                    <SelectItem value="2">High</SelectItem>
                                                    <SelectItem value="3">Very High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="contact_name">Contact Name</Label>
                                            <Input
                                                id="contact_name"
                                                value={form.contact_name}
                                                onChange={(e) => updateField('contact_name', e.target.value)}
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="partner_name">Company Name</Label>
                                            <Input
                                                id="partner_name"
                                                value={form.partner_name}
                                                onChange={(e) => updateField('partner_name', e.target.value)}
                                                placeholder="Acme Inc."
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="function">Job Title</Label>
                                            <Input
                                                id="function"
                                                value={form.function}
                                                onChange={(e) => updateField('function', e.target.value)}
                                                placeholder="CEO"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                placeholder="john@acme.com"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={form.phone}
                                                onChange={(e) => updateField('phone', e.target.value)}
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="mobile">Mobile</Label>
                                            <Input
                                                id="mobile"
                                                value={form.mobile}
                                                onChange={(e) => updateField('mobile', e.target.value)}
                                                placeholder="+1 234 567 891"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label htmlFor="website">Website</Label>
                                            <Input
                                                id="website"
                                                value={form.website}
                                                onChange={(e) => updateField('website', e.target.value)}
                                                placeholder="https://acme.com"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Address */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Address</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Label htmlFor="street">Street</Label>
                                            <Input
                                                id="street"
                                                value={form.street}
                                                onChange={(e) => updateField('street', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={form.city}
                                                onChange={(e) => updateField('city', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="state">State/Province</Label>
                                            <Input
                                                id="state"
                                                value={form.state}
                                                onChange={(e) => updateField('state', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="zip">ZIP Code</Label>
                                            <Input
                                                id="zip"
                                                value={form.zip}
                                                onChange={(e) => updateField('zip', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="country_code">Country Code</Label>
                                            <Input
                                                id="country_code"
                                                value={form.country_code}
                                                onChange={(e) => updateField('country_code', e.target.value.toUpperCase())}
                                                placeholder="US"
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={form.description}
                                            onChange={(e) => updateField('description', e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="internal_notes">Internal Notes</Label>
                                        <Textarea
                                            id="internal_notes"
                                            value={form.internal_notes}
                                            onChange={(e) => updateField('internal_notes', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Pipeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pipeline</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="stage_id">Stage</Label>
                                        <Select value={form.stage_id || 'none'} onValueChange={(v) => updateField('stage_id', v === 'none' ? '' : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select stage..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stages.map((stage) => (
                                                    <SelectItem key={stage.id} value={stage.id.toString()}>
                                                        {stage.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="team_id">Sales Team</Label>
                                        <Select value={form.team_id || 'none'} onValueChange={(v) => updateField('team_id', v === 'none' ? '' : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select team..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No team</SelectItem>
                                                {teams.map((team) => (
                                                    <SelectItem key={team.id} value={team.id.toString()}>
                                                        {team.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Revenue */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="expected_revenue">Expected Revenue</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="expected_revenue"
                                                type="number"
                                                value={form.expected_revenue}
                                                onChange={(e) => updateField('expected_revenue', e.target.value)}
                                                placeholder="0.00"
                                                className="flex-1"
                                            />
                                            <Select value={form.currency_code} onValueChange={(v) => updateField('currency_code', v)}>
                                                <SelectTrigger className="w-24">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EUR">EUR</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="GBP">GBP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="date_deadline">Expected Close</Label>
                                        <Input
                                            id="date_deadline"
                                            type="date"
                                            value={form.date_deadline}
                                            onChange={(e) => updateField('date_deadline', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Source */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Source Tracking</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="source">Source</Label>
                                        <Input
                                            id="source"
                                            value={form.source}
                                            onChange={(e) => updateField('source', e.target.value)}
                                            placeholder="google, linkedin, referral..."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="medium">Medium</Label>
                                        <Input
                                            id="medium"
                                            value={form.medium}
                                            onChange={(e) => updateField('medium', e.target.value)}
                                            placeholder="organic, cpc, email..."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="campaign">Campaign</Label>
                                        <Input
                                            id="campaign"
                                            value={form.campaign}
                                            onChange={(e) => updateField('campaign', e.target.value)}
                                            placeholder="summer_promo..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
