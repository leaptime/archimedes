import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Search,
    Plus,
    Building2,
    User,
    Mail,
    Phone,
    Users,
    RefreshCw,
    LayoutGrid,
    List,
    Filter,
    X,
    ShoppingCart,
    Package,
    Globe,
    Tag,
    MapPin,
    CreditCard,
    FileText,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExtensionPoint, FormExtensionSlot } from '@/components/modules';

// Types
interface Contact {
    id: number;
    name: string;
    display_name?: string;
    ref?: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    website?: string | null;
    company: string | null;
    job_title: string | null;
    is_company: boolean;
    is_customer: boolean;
    is_vendor: boolean;
    type: string;
    vat?: string;
    street?: string;
    city: string | null;
    country?: string | null;
    country_id?: number;
    industry_id?: number;
    industry?: { id: number; name: string } | null;
    categories?: Array<{ id: number; name: string; color: string }>;
    category_ids?: number[];
    countryRelation?: { id: number; name: string; code: string } | null;
    notes?: string;
    active: boolean;
    // Extension fields
    credit_limit?: number;
    total_invoiced?: number;
    outstanding_balance?: number;
    invoice_count?: number;
    created_at: string;
}

interface ContactsResponse {
    data: Contact[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface ContactOptions {
    titles: Array<{ id: number; name: string; shortcut: string }>;
    industries: Array<{ id: number; name: string }>;
    countries: Array<{ id: number; name: string; code: string; phone_code?: string }>;
    categories: Array<{ id: number; name: string; color: string; parent_id?: number }>;
    types: Array<{ value: string; label: string }>;
    company_types: Array<{ value: string; label: string }>;
}

interface ContactStats {
    total: number;
    companies: number;
    individuals: number;
    customers: number;
    vendors: number;
    active: number;
    by_industry: Array<{ name: string; count: number }>;
    by_country: Array<{ name: string; code: string; count: number }>;
}

// API Functions
async function fetchContacts(params: Record<string, any> = {}): Promise<ContactsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    const response = await axios.get(`/api/contacts?${searchParams}`);
    return response.data;
}

async function fetchOptions(): Promise<ContactOptions> {
    const response = await axios.get('/api/contacts/options');
    return response.data.data;
}

async function fetchStats(): Promise<ContactStats> {
    const response = await axios.get('/api/contacts/stats');
    return response.data.data;
}

async function createContact(data: Partial<Contact>): Promise<Contact> {
    const response = await axios.post('/api/contacts', data);
    return response.data.data;
}

async function updateContact(id: number, data: Partial<Contact>): Promise<Contact> {
    const response = await axios.put(`/api/contacts/${id}`, data);
    return response.data.data;
}

async function deleteContact(id: number): Promise<void> {
    await axios.delete(`/api/contacts/${id}`);
}

// Contact Card Component
function ContactCard({ 
    contact, 
    onView, 
    onEdit, 
    onDelete 
}: { 
    contact: Contact;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        contact.is_company ? 'bg-blue-500/10' : 'bg-green-500/10'
                    }`}>
                        {contact.is_company ? (
                            <Building2 className="w-6 h-6 text-blue-600" />
                        ) : (
                            <User className="w-6 h-6 text-green-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">
                            {contact.display_name || contact.name}
                        </h3>
                        {contact.company && !contact.is_company && (
                            <p className="text-sm text-muted-foreground">{contact.company}</p>
                        )}
                        {contact.job_title && !contact.is_company && (
                            <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                        )}
                        {contact.industry && contact.is_company && (
                            <p className="text-xs text-muted-foreground">{contact.industry.name}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
                {contact.is_customer && (
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                        Customer
                    </Badge>
                )}
                {contact.is_vendor && (
                    <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700">
                        Vendor
                    </Badge>
                )}
                {contact.categories?.map(cat => (
                    <Badge 
                        key={cat.id} 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: cat.color, color: cat.color }}
                    >
                        {cat.name}
                    </Badge>
                ))}
            </div>

            {/* Contact Info */}
            <div className="mt-4 space-y-1.5">
                {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${contact.email}`} className="hover:text-foreground truncate">
                            {contact.email}
                        </a>
                    </div>
                )}
                {(contact.phone || contact.mobile) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${contact.phone || contact.mobile}`} className="hover:text-foreground">
                            {contact.phone || contact.mobile}
                        </a>
                    </div>
                )}
                {(contact.city || contact.countryRelation) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                            {[contact.city, contact.countryRelation?.name].filter(Boolean).join(', ')}
                        </span>
                    </div>
                )}
            </div>

            {/* Extension: Invoicing info */}
            {(contact.invoice_count !== undefined || contact.outstanding_balance !== undefined) && (
                <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                        {contact.invoice_count !== undefined && (
                            <span className="text-muted-foreground">
                                {contact.invoice_count} invoice{contact.invoice_count !== 1 ? 's' : ''}
                            </span>
                        )}
                        {contact.outstanding_balance !== undefined && contact.outstanding_balance > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                {contact.outstanding_balance.toLocaleString()} due
                            </Badge>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// Contact Form Dialog
function ContactFormDialog({
    open,
    onOpenChange,
    contact,
    onSave,
    options,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact: Contact | null;
    onSave: (data: Partial<Contact>) => void;
    options?: ContactOptions;
}) {
    const [formData, setFormData] = useState<Partial<Contact>>(
        contact || { name: '', email: '', phone: '', is_company: false, is_customer: false, is_vendor: false, active: true }
    );
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        if (contact) {
            setFormData(contact);
        } else {
            setFormData({ name: '', email: '', phone: '', is_company: false, is_customer: false, is_vendor: false, active: true });
        }
        setActiveTab('basic');
    }, [contact, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{contact ? 'Edit Contact' : 'New Contact'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    {/* Type Toggle */}
                    <div className="flex items-center gap-4 mb-6 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="is_company"
                                checked={formData.is_company || false}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_company: checked })}
                            />
                            <Label htmlFor="is_company">Company</Label>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <Switch
                                id="active"
                                checked={formData.active !== false}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                            <Label htmlFor="active">Active</Label>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="address">Address</TabsTrigger>
                            <TabsTrigger value="classification">Classification</TabsTrigger>
                            {formData.is_company && <TabsTrigger value="legal">Legal</TabsTrigger>}
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>{formData.is_company ? 'Company Name' : 'Full Name'} *</Label>
                                    <Input
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reference</Label>
                                    <Input
                                        value={formData.ref || ''}
                                        onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                                        placeholder="Internal reference"
                                    />
                                </div>
                                {!formData.is_company && (
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <Input
                                            value={formData.job_title || ''}
                                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile</Label>
                                    <Input
                                        value={formData.mobile || ''}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input
                                        value={formData.website || ''}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            {!formData.is_company && (
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input
                                        value={formData.company || ''}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        placeholder="Company name"
                                    />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="address" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Street</Label>
                                <Input
                                    value={formData.street || ''}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        value={formData.city || ''}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Select
                                        value={formData.country_id?.toString() || ''}
                                        onValueChange={(v) => setFormData({ ...formData, country_id: v ? parseInt(v) : undefined })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options?.countries.map((country) => (
                                                <SelectItem key={country.id} value={country.id.toString()}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="classification" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    <Select
                                        value={formData.industry_id?.toString() || ''}
                                        onValueChange={(v) => setFormData({ ...formData, industry_id: v ? parseInt(v) : undefined })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options?.industries.map((ind) => (
                                                <SelectItem key={ind.id} value={ind.id.toString()}>
                                                    {ind.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="is_customer"
                                        checked={formData.is_customer || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_customer: checked })}
                                    />
                                    <Label htmlFor="is_customer" className="flex items-center gap-1">
                                        <ShoppingCart className="w-4 h-4" />
                                        Customer
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="is_vendor"
                                        checked={formData.is_vendor || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_vendor: checked })}
                                    />
                                    <Label htmlFor="is_vendor" className="flex items-center gap-1">
                                        <Package className="w-4 h-4" />
                                        Vendor
                                    </Label>
                                </div>
                            </div>
                            
                            {/* Categories/Tags */}
                            {options?.categories && options.categories.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-border">
                                    <Label className="flex items-center gap-1">
                                        <Tag className="w-4 h-4" />
                                        Tags / Categories
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {options.categories.map((cat) => {
                                            const isSelected = formData.category_ids?.includes(cat.id) || 
                                                formData.categories?.some(c => c.id === cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentIds = formData.category_ids || 
                                                            formData.categories?.map(c => c.id) || [];
                                                        const newIds = isSelected
                                                            ? currentIds.filter(id => id !== cat.id)
                                                            : [...currentIds, cat.id];
                                                        setFormData({ ...formData, category_ids: newIds });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                    style={isSelected ? { borderColor: cat.color, backgroundColor: `${cat.color}20`, color: cat.color } : {}}
                                                >
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {formData.is_company && (
                            <TabsContent value="legal" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tax ID / VAT</Label>
                                        <Input
                                            value={formData.vat || ''}
                                            onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
                                            placeholder="e.g., US123456789"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>

                    <div className="space-y-2 mt-4">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {/* Extension point for additional form fields from other modules */}
                    <FormExtensionSlot
                        name="contacts.form.additional-fields"
                        data={formData}
                        setData={setFormData}
                        className="mt-4 space-y-4"
                    />

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {contact ? 'Save Changes' : 'Create Contact'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Main Contacts Page
export default function Contacts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [typeFilter, setTypeFilter] = useState<'all' | 'company' | 'individual'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [advancedFilters, setAdvancedFilters] = useState<{
        country_id?: number;
        industry_id?: number;
        category_id?: number;
        customers_only?: boolean;
        vendors_only?: boolean;
    }>({});
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const hasActiveFilters = Object.values(advancedFilters).some(v => v !== undefined && v !== false);

    // Fetch contacts
    const { data: contactsData, isLoading, error, refetch } = useQuery({
        queryKey: ['contacts', search, typeFilter, advancedFilters],
        queryFn: () => fetchContacts({
            search,
            companies_only: typeFilter === 'company' ? 1 : undefined,
            individuals_only: typeFilter === 'individual' ? 1 : undefined,
            ...advancedFilters,
        }),
    });

    // Fetch options
    const { data: options } = useQuery({
        queryKey: ['contact-options'],
        queryFn: fetchOptions,
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['contact-stats'],
        queryFn: fetchStats,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
            setDialogOpen(false);
            toast.success('Contact created successfully');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to create contact';
            const errors = error.response?.data?.errors;
            if (errors) {
                const firstError = Object.values(errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : message);
            } else {
                toast.error(message);
            }
            console.error('Create contact error:', error.response?.data);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Contact> }) => updateContact(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setDialogOpen(false);
            setEditingContact(null);
            toast.success('Contact updated successfully');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to update contact';
            const errors = error.response?.data?.errors;
            if (errors) {
                const firstError = Object.values(errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : message);
            } else {
                toast.error(message);
            }
            console.error('Update contact error:', error.response?.data);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
            toast.success('Contact deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete contact');
        },
    });

    const handleSave = (formData: Partial<Contact>) => {
        if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setDialogOpen(true);
    };

    const handleDelete = (contact: Contact) => {
        if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
            deleteMutation.mutate(contact.id);
        }
    };

    const handleNewContact = () => {
        setEditingContact(null);
        setDialogOpen(true);
    };

    const handleView = (contact: Contact) => {
        navigate(`/contacts/${contact.id}`);
    };

    return (
        <DashboardLayout>
            <DashboardHeader title="Contacts" subtitle="Manage your contacts and companies" />
            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-xl border border-border p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-card rounded-xl border border-border p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats?.companies || 0}</p>
                                <p className="text-xs text-muted-foreground">Companies</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-xl border border-border p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats?.individuals || 0}</p>
                                <p className="text-xs text-muted-foreground">Individuals</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-card rounded-xl border border-border p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats?.customers || 0}</p>
                                <p className="text-xs text-muted-foreground">Customers</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card rounded-xl border border-border p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats?.vendors || 0}</p>
                                <p className="text-xs text-muted-foreground">Vendors</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Extension point for additional stats/widgets */}
                <ExtensionPoint 
                    name="contacts.list.after-stats" 
                    context={{ stats, contacts: contactsData?.data }}
                    className="mb-6"
                />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                        <Button
                            variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setTypeFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={typeFilter === 'company' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => setTypeFilter('company')}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            Companies
                        </Button>
                        <Button
                            variant={typeFilter === 'individual' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => setTypeFilter('individual')}
                        >
                            <User className="w-3.5 h-3.5" />
                            Individuals
                        </Button>
                    </div>

                    <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button 
                        variant={hasActiveFilters ? 'secondary' : 'outline'} 
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                                {Object.values(advancedFilters).filter(v => v !== undefined && v !== false).length}
                            </Badge>
                        )}
                    </Button>

                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>

                    <Button onClick={handleNewContact}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Contact
                    </Button>

                    {/* Extension point for additional filter buttons */}
                    <ExtensionPoint 
                        name="contacts.list.filter-actions" 
                        context={{ typeFilter, advancedFilters, setAdvancedFilters }}
                    />
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-card border border-border rounded-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Advanced Filters</h3>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAdvancedFilters({})}
                                    className="text-muted-foreground"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear all
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Country</Label>
                                <Select
                                    value={advancedFilters.country_id?.toString() || 'any'}
                                    onValueChange={(v) => setAdvancedFilters({ ...advancedFilters, country_id: v && v !== 'any' ? parseInt(v) : undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any country</SelectItem>
                                        {options?.countries.map((country) => (
                                            <SelectItem key={country.id} value={country.id.toString()}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Industry</Label>
                                <Select
                                    value={advancedFilters.industry_id?.toString() || 'any'}
                                    onValueChange={(v) => setAdvancedFilters({ ...advancedFilters, industry_id: v && v !== 'any' ? parseInt(v) : undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any industry</SelectItem>
                                        {options?.industries.map((ind) => (
                                            <SelectItem key={ind.id} value={ind.id.toString()}>
                                                {ind.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Category</Label>
                                <Select
                                    value={advancedFilters.category_id?.toString() || 'any'}
                                    onValueChange={(v) => setAdvancedFilters({ ...advancedFilters, category_id: v && v !== 'any' ? parseInt(v) : undefined })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any category</SelectItem>
                                        {options?.categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                <span className="flex items-center gap-2">
                                                    <span 
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                    />
                                                    {cat.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3 pt-6">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="customers_filter"
                                        checked={advancedFilters.customers_only || false}
                                        onCheckedChange={(checked) => setAdvancedFilters({ ...advancedFilters, customers_only: checked || undefined })}
                                    />
                                    <Label htmlFor="customers_filter" className="text-sm flex items-center gap-1">
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        Customers only
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="vendors_filter"
                                        checked={advancedFilters.vendors_only || false}
                                        onCheckedChange={(checked) => setAdvancedFilters({ ...advancedFilters, vendors_only: checked || undefined })}
                                    />
                                    <Label htmlFor="vendors_filter" className="text-sm flex items-center gap-1">
                                        <Package className="w-3.5 h-3.5" />
                                        Vendors only
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center mb-6">
                        <p className="text-destructive font-medium">Failed to load contacts</p>
                        <p className="text-sm text-muted-foreground mt-1">Please make sure you are logged in.</p>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-48 rounded-xl" />
                        ))}
                    </div>
                )}

                {/* Contacts Grid/List */}
                {!isLoading && !error && contactsData?.data && (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contactsData.data.map((contact) => (
                                <ContactCard
                                    key={contact.id}
                                    contact={contact}
                                    onView={() => handleView(contact)}
                                    onEdit={() => handleEdit(contact)}
                                    onDelete={() => handleDelete(contact)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card rounded-xl border border-border divide-y divide-border">
                            {contactsData.data.map((contact) => (
                                <div 
                                    key={contact.id}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        contact.is_company ? 'bg-blue-500/10' : 'bg-green-500/10'
                                    }`}>
                                        {contact.is_company ? (
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <User className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground truncate">
                                                {contact.display_name || contact.name}
                                            </span>
                                            {contact.is_customer && (
                                                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                                                    Customer
                                                </Badge>
                                            )}
                                            {contact.is_vendor && (
                                                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700">
                                                    Vendor
                                                </Badge>
                                            )}
                                        </div>
                                        {(contact.company || contact.job_title) && !contact.is_company && (
                                            <p className="text-sm text-muted-foreground truncate">
                                                {[contact.job_title, contact.company].filter(Boolean).join(' at ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                                        {contact.email && (
                                            <span className="truncate max-w-[200px]">{contact.email}</span>
                                        )}
                                        {contact.phone && (
                                            <span>{contact.phone}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(contact)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(contact)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(contact)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Empty State */}
                {!isLoading && !error && contactsData?.data.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">No contacts yet</p>
                        <p className="text-muted-foreground mb-4">
                            Get started by creating your first contact.
                        </p>
                        <Button onClick={handleNewContact}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Contact
                        </Button>
                    </div>
                )}

                {/* Contact Form Dialog */}
                <ContactFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    contact={editingContact}
                    onSave={handleSave}
                    options={options}
                />
            </div>
        </DashboardLayout>
    );
}
