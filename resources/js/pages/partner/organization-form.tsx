import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateOrganization } from '@/hooks/use-partner';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building2, User, Save } from 'lucide-react';

const organizationTypes = [
    { value: 'company', label: 'Company' },
    { value: 'nonprofit', label: 'Non-Profit Organization' },
    { value: 'government', label: 'Government / Public Administration' },
    { value: 'education', label: 'Educational Institution' },
    { value: 'individual', label: 'Individual / Freelancer' },
];

const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Rome', label: 'Rome (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const countries = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
];

interface FormData {
    // Organization
    name: string;
    type: string;
    email: string;
    phone: string;
    website: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    tax_id: string;
    vat_number: string;
    industry: string;
    timezone: string;
    currency: string;
    // Owner
    owner_name: string;
    owner_email: string;
    owner_password: string;
}

const initialFormData: FormData = {
    name: '',
    type: 'company',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    tax_id: '',
    vat_number: '',
    industry: '',
    timezone: 'UTC',
    currency: 'USD',
    owner_name: '',
    owner_email: '',
    owner_password: '',
};

export default function PartnerOrganizationForm() {
    const navigate = useNavigate();
    const createOrg = useCreateOrganization();
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.name.trim()) newErrors.name = 'Organization name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.owner_name.trim()) newErrors.owner_name = 'Owner name is required';
        if (!formData.owner_email.trim()) newErrors.owner_email = 'Owner email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)) newErrors.owner_email = 'Invalid email format';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;

        try {
            const result = await createOrg.mutateAsync(formData);
            toast.success('Organization created successfully');
            navigate(`/partner/organizations/${result.organization.id}`);
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || 'Failed to create organization');
            }
        }
    };

    return (
        <DashboardLayout>
            <DashboardHeader
                title="New Organization"
                subtitle="Create a new customer organization"
            >
                <Button variant="outline" asChild>
                    <Link to="/partner/organizations">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
            </DashboardHeader>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Organization Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Organization Details
                        </CardTitle>
                        <CardDescription>Basic information about the organization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Organization Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Acme Inc."
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Organization Type *</Label>
                                <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizationTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="contact@acme.com"
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://acme.com"
                            />
                        </div>

                        <Separator />

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="street">Street Address</Label>
                                <Input
                                    id="street"
                                    value={formData.street}
                                    onChange={(e) => handleChange('street', e.target.value)}
                                    placeholder="123 Main Street"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="San Francisco"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State / Province</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    placeholder="CA"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP / Postal Code</Label>
                                <Input
                                    id="zip"
                                    value={formData.zip}
                                    onChange={(e) => handleChange('zip', e.target.value)}
                                    placeholder="94105"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax_id">Tax ID / EIN</Label>
                                <Input
                                    id="tax_id"
                                    value={formData.tax_id}
                                    onChange={(e) => handleChange('tax_id', e.target.value)}
                                    placeholder="XX-XXXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vat_number">VAT Number</Label>
                                <Input
                                    id="vat_number"
                                    value={formData.vat_number}
                                    onChange={(e) => handleChange('vat_number', e.target.value)}
                                    placeholder="e.g., IT12345678901"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    value={formData.industry}
                                    onChange={(e) => handleChange('industry', e.target.value)}
                                    placeholder="e.g., Technology"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Timezone</Label>
                                <Select value={formData.timezone} onValueChange={(v) => handleChange('timezone', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timezones.map((tz) => (
                                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Owner Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Organization Owner
                        </CardTitle>
                        <CardDescription>
                            The primary administrator for this organization. They will receive login credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="owner_name">Full Name *</Label>
                                <Input
                                    id="owner_name"
                                    value={formData.owner_name}
                                    onChange={(e) => handleChange('owner_name', e.target.value)}
                                    placeholder="John Doe"
                                    className={errors.owner_name ? 'border-red-500' : ''}
                                />
                                {errors.owner_name && <p className="text-xs text-red-500">{errors.owner_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner_email">Email *</Label>
                                <Input
                                    id="owner_email"
                                    type="email"
                                    value={formData.owner_email}
                                    onChange={(e) => handleChange('owner_email', e.target.value)}
                                    placeholder="john@acme.com"
                                    className={errors.owner_email ? 'border-red-500' : ''}
                                />
                                {errors.owner_email && <p className="text-xs text-red-500">{errors.owner_email}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="owner_password">Password (optional)</Label>
                            <Input
                                id="owner_password"
                                type="password"
                                value={formData.owner_password}
                                onChange={(e) => handleChange('owner_password', e.target.value)}
                                placeholder="Leave empty to auto-generate"
                            />
                            <p className="text-xs text-muted-foreground">
                                If left empty, a secure password will be generated and sent to the owner's email.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/partner/organizations')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createOrg.isPending}>
                        {createOrg.isPending ? (
                            'Creating...'
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Organization
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
