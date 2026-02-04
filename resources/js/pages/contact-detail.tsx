import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ChevronLeft,
    Building2,
    User,
    Mail,
    Phone,
    Globe,
    MapPin,
    Edit,
    Trash2,
    MoreHorizontal,
    ShoppingCart,
    Package,
    FileText,
    CreditCard,
    Tag,
    Calendar,
    Clock,
    Star,
    Briefcase,
    Hash,
    Users,
    RefreshCw,
    Plus,
    ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExtensionPoint, DetailExtensionSlot } from '@/components/modules';
import { AddressManager, type Address } from '@modules/contacts/frontend/components/AddressManager';
import { BankAccountManager, type BankAccount } from '@modules/contacts/frontend/components/BankAccountManager';

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
    is_employee: boolean;
    type: string;
    vat?: string;
    company_registry?: string;
    street?: string;
    street2?: string;
    city: string | null;
    zip?: string;
    country_id?: number;
    state_id?: number;
    industry_id?: number;
    title_id?: number;
    parent_id?: number;
    lang?: string;
    timezone?: string;
    notes?: string;
    active: boolean;
    customer_rank?: number;
    supplier_rank?: number;
    // Relations
    industry?: { id: number; name: string } | null;
    title?: { id: number; name: string; shortcut: string } | null;
    countryRelation?: { id: number; name: string; code: string } | null;
    stateRelation?: { id: number; name: string; code: string } | null;
    parent?: { id: number; name: string } | null;
    categories?: Array<{ id: number; name: string; color: string }>;
    addresses?: Address[];
    bankAccounts?: BankAccount[];
    children?: Array<{ id: number; name: string; is_company: boolean }>;
    // Extension fields (invoicing)
    credit_limit?: number;
    total_invoiced?: number;
    outstanding_balance?: number;
    invoice_count?: number;
    created_at: string;
    updated_at: string;
}

interface ContactOptions {
    titles: Array<{ id: number; name: string; shortcut: string }>;
    industries: Array<{ id: number; name: string }>;
    countries: Array<{ id: number; name: string; code: string; phone_code?: string }>;
    categories: Array<{ id: number; name: string; color: string; parent_id?: number }>;
}

async function fetchContact(id: string): Promise<Contact> {
    const response = await axios.get(`/api/contacts/${id}`);
    return response.data.data;
}

async function fetchOptions(): Promise<ContactOptions> {
    const response = await axios.get('/api/contacts/options');
    return response.data.data;
}

async function fetchStates(countryId: number) {
    const response = await axios.get(`/api/contacts/states/${countryId}`);
    return response.data.data;
}

async function deleteContact(id: number): Promise<void> {
    await axios.delete(`/api/contacts/${id}`);
}

function InfoItem({ icon: Icon, label, value, href }: { icon: any; label: string; value?: string | null; href?: string }) {
    if (!value) return null;
    
    const content = (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );

    if (href) {
        return (
            <a href={href} className="hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
                {content}
            </a>
        );
    }

    return content;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    return (
        <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    );
}

export default function ContactDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: contact, isLoading, error, refetch } = useQuery({
        queryKey: ['contact', id],
        queryFn: () => fetchContact(id!),
        enabled: !!id,
    });

    const { data: options } = useQuery({
        queryKey: ['contact-options'],
        queryFn: fetchOptions,
    });

    const { data: states } = useQuery({
        queryKey: ['states', contact?.country_id],
        queryFn: () => fetchStates(contact!.country_id!),
        enabled: !!contact?.country_id,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast.success('Contact deleted successfully');
            navigate('/contacts');
        },
        onError: () => {
            toast.error('Failed to delete contact');
        },
    });

    // Address mutations
    const addAddressMutation = useMutation({
        mutationFn: async (address: Omit<Address, 'id'>) => {
            const response = await axios.post(`/api/contacts/${id}/addresses`, address);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact', id] });
            toast.success('Address added');
        },
        onError: () => toast.error('Failed to add address'),
    });

    const updateAddressMutation = useMutation({
        mutationFn: async ({ addressId, data }: { addressId: number; data: Partial<Address> }) => {
            const response = await axios.put(`/api/contacts/${id}/addresses/${addressId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact', id] });
            toast.success('Address updated');
        },
        onError: () => toast.error('Failed to update address'),
    });

    const deleteAddressMutation = useMutation({
        mutationFn: async (addressId: number) => {
            await axios.delete(`/api/contacts/${id}/addresses/${addressId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact', id] });
            toast.success('Address deleted');
        },
        onError: () => toast.error('Failed to delete address'),
    });

    // Bank account mutations
    const addBankAccountMutation = useMutation({
        mutationFn: async (account: Omit<BankAccount, 'id'>) => {
            const response = await axios.post(`/api/contacts/${id}/bank-accounts`, account);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact', id] });
            toast.success('Bank account added');
        },
        onError: () => toast.error('Failed to add bank account'),
    });

    const deleteBankAccountMutation = useMutation({
        mutationFn: async (accountId: number) => {
            await axios.delete(`/api/contacts/${id}/bank-accounts/${accountId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact', id] });
            toast.success('Bank account deleted');
        },
        onError: () => toast.error('Failed to delete bank account'),
    });

    const handleDelete = () => {
        if (id) {
            deleteMutation.mutate(parseInt(id));
        }
    };

    if (error) {
        return (
            <DashboardLayout>
                <DashboardHeader title="Contact" subtitle="View contact details" />
                <div className="p-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                        <p className="text-destructive font-medium">Failed to load contact</p>
                        <p className="text-sm text-muted-foreground mt-1">The contact may not exist or you may not have permission.</p>
                        <div className="flex gap-2 justify-center mt-4">
                            <Link to="/contacts">
                                <Button variant="outline">
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Back to Contacts
                                </Button>
                            </Link>
                            <Button onClick={() => refetch()}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader 
                title={contact?.display_name || contact?.name || 'Contact'} 
                subtitle={contact?.is_company ? 'Company' : 'Individual'} 
            />
            <div className="p-6">
                {/* Back button and actions */}
                <div className="flex items-center justify-between mb-6">
                    <Link to="/contacts">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Contacts
                        </Button>
                    </Link>
                    
                    {contact && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            <Link to={`/contacts/view?id=${contact.id}`}>
                                <Button size="sm">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/contacts/view?id=${contact.id}`)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Contact
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Contact
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                ) : contact ? (
                    <div className="space-y-6">
                        {/* Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-card border border-border rounded-xl"
                        >
                            <div className="flex items-start gap-6">
                                <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${
                                    contact.is_company ? 'bg-blue-500/10' : 'bg-green-500/10'
                                }`}>
                                    {contact.is_company ? (
                                        <Building2 className="w-10 h-10 text-blue-600" />
                                    ) : (
                                        <User className="w-10 h-10 text-green-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {contact.title && (
                                                    <span className="text-muted-foreground">{contact.title.shortcut}</span>
                                                )}
                                                <h2 className="text-2xl font-bold">{contact.display_name || contact.name}</h2>
                                                {!contact.active && (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </div>
                                            {contact.ref && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    <Hash className="w-3 h-3 inline mr-1" />
                                                    {contact.ref}
                                                </p>
                                            )}
                                            {contact.job_title && !contact.is_company && (
                                                <p className="text-muted-foreground mt-1">{contact.job_title}</p>
                                            )}
                                            {contact.parent && (
                                                <Link to={`/contacts/${contact.parent.id}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                                                    <Building2 className="w-3 h-3 inline mr-1" />
                                                    {contact.parent.name}
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {contact.is_company ? (
                                            <Badge className="bg-blue-500/10 text-blue-700 border-blue-300">
                                                <Building2 className="w-3 h-3 mr-1" />
                                                Company
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-green-500/10 text-green-700 border-green-300">
                                                <User className="w-3 h-3 mr-1" />
                                                Individual
                                            </Badge>
                                        )}
                                        {contact.is_customer && (
                                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300">
                                                <ShoppingCart className="w-3 h-3 mr-1" />
                                                Customer
                                            </Badge>
                                        )}
                                        {contact.is_vendor && (
                                            <Badge className="bg-purple-500/10 text-purple-700 border-purple-300">
                                                <Package className="w-3 h-3 mr-1" />
                                                Vendor
                                            </Badge>
                                        )}
                                        {contact.is_employee && (
                                            <Badge className="bg-orange-500/10 text-orange-700 border-orange-300">
                                                <Briefcase className="w-3 h-3 mr-1" />
                                                Employee
                                            </Badge>
                                        )}
                                        {contact.industry && (
                                            <Badge variant="outline">
                                                {contact.industry.name}
                                            </Badge>
                                        )}
                                        {contact.categories?.map(cat => (
                                            <Badge 
                                                key={cat.id} 
                                                variant="outline"
                                                style={{ borderColor: cat.color, color: cat.color }}
                                            >
                                                <Tag className="w-3 h-3 mr-1" />
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick contact info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                                {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        {contact.email}
                                    </a>
                                )}
                                {contact.phone && (
                                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        {contact.phone}
                                    </a>
                                )}
                                {contact.website && (
                                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                        Website
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {(contact.city || contact.countryRelation) && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {[contact.city, contact.countryRelation?.name].filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Stats (if customer/vendor) */}
                        {(contact.is_customer || contact.is_vendor) && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    label="Total Invoiced"
                                    value={`$${(contact.total_invoiced || 0).toLocaleString()}`}
                                    icon={FileText}
                                    color="bg-blue-500/10 text-blue-600"
                                />
                                <StatCard
                                    label="Outstanding"
                                    value={`$${(contact.outstanding_balance || 0).toLocaleString()}`}
                                    icon={CreditCard}
                                    color={contact.outstanding_balance ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}
                                />
                                <StatCard
                                    label="Invoices"
                                    value={contact.invoice_count || 0}
                                    icon={FileText}
                                    color="bg-purple-500/10 text-purple-600"
                                />
                                <StatCard
                                    label="Credit Limit"
                                    value={contact.credit_limit ? `$${contact.credit_limit.toLocaleString()}` : 'Unlimited'}
                                    icon={Star}
                                    color="bg-emerald-500/10 text-emerald-600"
                                />
                            </div>
                        )}

                        {/* Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-xl"
                        >
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
                                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="addresses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                        Addresses ({contact.addresses?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="banking" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                        Banking ({contact.bankAccounts?.length || 0})
                                    </TabsTrigger>
                                    {contact.children && contact.children.length > 0 && (
                                        <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                            Related ({contact.children.length})
                                        </TabsTrigger>
                                    )}
                                    <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                        Notes
                                    </TabsTrigger>
                                    {/* Extension point for additional tabs from other modules */}
                                    <ExtensionPoint 
                                        name="contacts.detail.tabs" 
                                        context={{ contact, activeTab, setActiveTab }}
                                    />
                                </TabsList>

                                <TabsContent value="overview" className="p-6">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Contact Information */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                                            <div className="space-y-1">
                                                <InfoItem icon={Mail} label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
                                                <InfoItem icon={Phone} label="Phone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
                                                <InfoItem icon={Phone} label="Mobile" value={contact.mobile} href={contact.mobile ? `tel:${contact.mobile}` : undefined} />
                                                <InfoItem icon={Globe} label="Website" value={contact.website} href={contact.website || undefined} />
                                                {!contact.is_company && (
                                                    <>
                                                        <InfoItem icon={Briefcase} label="Job Title" value={contact.job_title} />
                                                        <InfoItem icon={Building2} label="Company" value={contact.company} />
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Primary Address</h3>
                                            <div className="space-y-1">
                                                <InfoItem icon={MapPin} label="Street" value={contact.street} />
                                                {contact.street2 && <InfoItem icon={MapPin} label="Street 2" value={contact.street2} />}
                                                <InfoItem icon={MapPin} label="City" value={contact.city} />
                                                <InfoItem icon={MapPin} label="Postal Code" value={contact.zip} />
                                                <InfoItem icon={MapPin} label="State" value={contact.stateRelation?.name} />
                                                <InfoItem icon={Globe} label="Country" value={contact.countryRelation?.name} />
                                            </div>
                                        </div>

                                        {/* Business Information (for companies) */}
                                        {contact.is_company && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                                                <div className="space-y-1">
                                                    <InfoItem icon={FileText} label="VAT / Tax ID" value={contact.vat} />
                                                    <InfoItem icon={Hash} label="Company Registry" value={contact.company_registry} />
                                                    <InfoItem icon={Briefcase} label="Industry" value={contact.industry?.name} />
                                                </div>
                                            </div>
                                        )}

                                        {/* System Information */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">System Information</h3>
                                            <div className="space-y-1">
                                                <InfoItem icon={Hash} label="Reference" value={contact.ref} />
                                                <InfoItem icon={Globe} label="Language" value={contact.lang} />
                                                <InfoItem icon={Clock} label="Timezone" value={contact.timezone} />
                                                <InfoItem 
                                                    icon={Calendar} 
                                                    label="Created" 
                                                    value={new Date(contact.created_at).toLocaleDateString()} 
                                                />
                                                <InfoItem 
                                                    icon={Clock} 
                                                    label="Last Updated" 
                                                    value={new Date(contact.updated_at).toLocaleDateString()} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="addresses" className="p-6">
                                    <AddressManager
                                        addresses={contact.addresses || []}
                                        onAdd={async (address) => {
                                            await addAddressMutation.mutateAsync(address);
                                        }}
                                        onUpdate={async (addressId, data) => {
                                            await updateAddressMutation.mutateAsync({ addressId, data });
                                        }}
                                        onDelete={async (addressId) => {
                                            await deleteAddressMutation.mutateAsync(addressId);
                                        }}
                                        countries={options?.countries}
                                        states={states}
                                    />
                                </TabsContent>

                                <TabsContent value="banking" className="p-6">
                                    <BankAccountManager
                                        accounts={contact.bankAccounts || []}
                                        onAdd={async (account) => {
                                            await addBankAccountMutation.mutateAsync(account);
                                        }}
                                        onDelete={async (accountId) => {
                                            await deleteBankAccountMutation.mutateAsync(accountId);
                                        }}
                                        countries={options?.countries}
                                    />
                                </TabsContent>

                                {contact.children && contact.children.length > 0 && (
                                    <TabsContent value="contacts" className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">Related Contacts</h3>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                {contact.children.map(child => (
                                                    <Link
                                                        key={child.id}
                                                        to={`/contacts/${child.id}`}
                                                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/20 transition-colors"
                                                    >
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                            child.is_company ? 'bg-blue-500/10' : 'bg-green-500/10'
                                                        }`}>
                                                            {child.is_company ? (
                                                                <Building2 className="w-5 h-5 text-blue-600" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-green-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{child.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {child.is_company ? 'Company' : 'Individual'}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}

                                <TabsContent value="notes" className="p-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Notes</h3>
                                        {contact.notes ? (
                                            <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                                                {contact.notes}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No notes added.</p>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Extension point for additional tab content from other modules */}
                                <DetailExtensionSlot
                                    name="contacts.detail.tab-content"
                                    entity={contact}
                                    onRefresh={() => refetch()}
                                />
                            </Tabs>
                        </motion.div>

                        {/* Extension point for additional sections below tabs */}
                        <DetailExtensionSlot
                            name="contacts.detail.below-tabs"
                            entity={contact}
                            onRefresh={() => refetch()}
                            className="space-y-6"
                        />
                    </div>
                ) : null}

                {/* Delete confirmation dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Contact</DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground">
                            Are you sure you want to delete <strong>{contact?.name}</strong>? This action cannot be undone.
                        </p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
