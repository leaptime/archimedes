import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// Import the view system
import '@modules/core/frontend/widgets/builtin';
import { ContactForm } from '@modules/contacts/frontend/views/ContactForm';
import '@modules/invoicing/frontend/extensions';

interface Contact {
    id?: number;
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    company: string | null;
    job_title: string | null;
    is_company: boolean;
    website: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    notes: string | null;
    // Invoicing extension fields (computed)
    credit_limit?: number | null;
    payment_term_id?: string | null;
    tax_id?: string | null;
    currency?: string;
    total_invoiced?: number;
    total_paid?: number;
    outstanding_balance?: number;
    invoice_count?: number;
    is_overdue?: boolean;
    last_invoice_date?: string | null;
    average_days_to_pay?: number | null;
    credit_on_hold?: boolean;
    credit_rating?: string | null;
}

const defaultContact: Contact = {
    name: '',
    email: null,
    phone: null,
    mobile: null,
    company: null,
    job_title: null,
    is_company: false,
    website: null,
    address_line_1: null,
    address_line_2: null,
    city: null,
    state: null,
    postal_code: null,
    country: null,
    notes: null,
    // Invoicing defaults
    credit_limit: null,
    payment_term_id: null,
    tax_id: null,
    currency: 'USD',
    total_invoiced: 0,
    total_paid: 0,
    outstanding_balance: 0,
    invoice_count: 0,
    is_overdue: false,
    last_invoice_date: null,
    average_days_to_pay: null,
    credit_on_hold: false,
    credit_rating: null,
};

async function fetchContact(id: string): Promise<Contact> {
    const response = await axios.get(`/api/contacts/${id}`);
    return response.data.data;
}

async function saveContact(contact: Contact): Promise<Contact> {
    if (contact.id) {
        const response = await axios.put(`/api/contacts/${contact.id}`, contact);
        return response.data.data;
    } else {
        const response = await axios.post('/api/contacts', contact);
        return response.data.data;
    }
}

export default function ContactViewPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const contactId = searchParams.get('id');
    const isNew = !contactId;

    const [contact, setContact] = useState<Contact>(defaultContact);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Fetch existing contact
    const { data, isLoading } = useQuery({
        queryKey: ['contact', contactId],
        queryFn: () => fetchContact(contactId!),
        enabled: !!contactId,
    });

    // Update local state when data loads
    useEffect(() => {
        if (data) {
            setContact(data);
        }
    }, [data]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: saveContact,
        onSuccess: (savedContact) => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contact', savedContact.id] });
            toast.success(isNew ? 'Contact created!' : 'Contact saved!');
            setIsDirty(false);
            if (isNew && savedContact.id) {
                navigate(`/contacts/view?id=${savedContact.id}`, { replace: true });
            }
        },
        onError: (error: any) => {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error('Failed to save contact');
            }
        },
    });

    const handleContactChange = (data: Record<string, any>) => {
        setContact(prev => ({ ...prev, ...data }));
        setIsDirty(true);
        // Clear error for changed field
        const changedKey = Object.keys(data)[0];
        if (errors[changedKey]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[changedKey];
                return next;
            });
        }
    };

    const handleSave = () => {
        // Basic validation
        const newErrors: Record<string, string> = {};
        if (!contact.name?.trim()) {
            newErrors.name = 'Name is required';
        }
        if (contact.type === 'company' && !contact.email?.trim()) {
            newErrors.email = 'Email is required for companies';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        saveMutation.mutate(contact);
    };

    const handleCancel = () => {
        if (isDirty) {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                return;
            }
        }
        navigate('/contacts');
    };

    if (isLoading && contactId) {
        return (
            <DashboardLayout>
                <DashboardHeader
                    title="Loading..."
                    subtitle="Please wait"
                />
                <div className="p-6">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader
                title={isNew ? 'New Contact' : contact.name || 'Contact'}
                subtitle={isNew ? 'Create a new contact' : `Editing contact #${contactId}`}
            />

            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header actions */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Contacts
                        </Button>

                        <div className="flex items-center gap-2">
                            {isDirty && (
                                <span className="text-sm text-muted-foreground">
                                    Unsaved changes
                                </span>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saveMutation.isPending}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saveMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>

                    {/* Contact form using new view system */}
                    <ContactForm
                        contact={contact}
                        onContactChange={handleContactChange}
                        errors={errors}
                        readonly={false}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
