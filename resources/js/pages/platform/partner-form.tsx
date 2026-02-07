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
import { useCreatePartner } from '@/hooks/use-platform';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Handshake, User, Save, Percent } from 'lucide-react';

const partnerTypes = [
    { value: 'reseller', label: 'Reseller' },
    { value: 'affiliate', label: 'Affiliate' },
    { value: 'distributor', label: 'Distributor' },
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
    // Partner
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
    commission_rate: string;
    minimum_payout: string;
    max_organizations: string;
    // Admin
    admin_name: string;
    admin_email: string;
    admin_password: string;
}

const initialFormData: FormData = {
    name: '',
    type: 'reseller',
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
    commission_rate: '20',
    minimum_payout: '100',
    max_organizations: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
};

export default function PlatformPartnerForm() {
    const navigate = useNavigate();
    const createPartner = useCreatePartner();
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

        if (!formData.name.trim()) newErrors.name = 'Partner name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.admin_name.trim()) newErrors.admin_name = 'Admin name is required';
        if (!formData.admin_email.trim()) newErrors.admin_email = 'Admin email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) newErrors.admin_email = 'Invalid email format';
        
        const commission = parseFloat(formData.commission_rate);
        if (isNaN(commission) || commission < 0 || commission > 100) {
            newErrors.commission_rate = 'Commission must be between 0 and 100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;

        try {
            const submitData = {
                ...formData,
                commission_rate: parseFloat(formData.commission_rate),
                minimum_payout: parseFloat(formData.minimum_payout) || 100,
                max_organizations: formData.max_organizations ? parseInt(formData.max_organizations) : undefined,
            };
            
            const result = await createPartner.mutateAsync(submitData);
            toast.success('Partner created successfully');
            navigate(`/platform/partners/${result.data.partner.id}`);
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || 'Failed to create partner');
            }
        }
    };

    return (
        <DashboardLayout>
            <DashboardHeader
                title="New Partner"
                subtitle="Add a new reseller or affiliate partner"
            >
                <Button variant="outline" asChild>
                    <Link to="/platform/partners">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
            </DashboardHeader>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Partner Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Handshake className="w-5 h-5" />
                            Partner Details
                        </CardTitle>
                        <CardDescription>Basic information about the partner</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Partner Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Partner Company Inc."
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Partner Type *</Label>
                                <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {partnerTypes.map((type) => (
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
                                    placeholder="partner@company.com"
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
                                placeholder="https://partner.com"
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP / Postal Code</Label>
                                <Input
                                    id="zip"
                                    value={formData.zip}
                                    onChange={(e) => handleChange('zip', e.target.value)}
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

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax_id">Tax ID / EIN</Label>
                                <Input
                                    id="tax_id"
                                    value={formData.tax_id}
                                    onChange={(e) => handleChange('tax_id', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vat_number">VAT Number</Label>
                                <Input
                                    id="vat_number"
                                    value={formData.vat_number}
                                    onChange={(e) => handleChange('vat_number', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Commission Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Percent className="w-5 h-5" />
                            Commission Settings
                        </CardTitle>
                        <CardDescription>Configure commission rate and limits</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
                                <Input
                                    id="commission_rate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.commission_rate}
                                    onChange={(e) => handleChange('commission_rate', e.target.value)}
                                    className={errors.commission_rate ? 'border-red-500' : ''}
                                />
                                {errors.commission_rate && <p className="text-xs text-red-500">{errors.commission_rate}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minimum_payout">Minimum Payout ($)</Label>
                                <Input
                                    id="minimum_payout"
                                    type="number"
                                    min="0"
                                    value={formData.minimum_payout}
                                    onChange={(e) => handleChange('minimum_payout', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_organizations">Max Organizations</Label>
                                <Input
                                    id="max_organizations"
                                    type="number"
                                    min="1"
                                    value={formData.max_organizations}
                                    onChange={(e) => handleChange('max_organizations', e.target.value)}
                                    placeholder="Unlimited"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Admin User */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Partner Admin User
                        </CardTitle>
                        <CardDescription>
                            Create the initial admin user who will manage this partner account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin_name">Full Name *</Label>
                                <Input
                                    id="admin_name"
                                    value={formData.admin_name}
                                    onChange={(e) => handleChange('admin_name', e.target.value)}
                                    placeholder="John Doe"
                                    className={errors.admin_name ? 'border-red-500' : ''}
                                />
                                {errors.admin_name && <p className="text-xs text-red-500">{errors.admin_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin_email">Email *</Label>
                                <Input
                                    id="admin_email"
                                    type="email"
                                    value={formData.admin_email}
                                    onChange={(e) => handleChange('admin_email', e.target.value)}
                                    placeholder="admin@partner.com"
                                    className={errors.admin_email ? 'border-red-500' : ''}
                                />
                                {errors.admin_email && <p className="text-xs text-red-500">{errors.admin_email}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin_password">Password (optional)</Label>
                            <Input
                                id="admin_password"
                                type="password"
                                value={formData.admin_password}
                                onChange={(e) => handleChange('admin_password', e.target.value)}
                                placeholder="Leave empty to auto-generate"
                            />
                            <p className="text-xs text-muted-foreground">
                                If left empty, a secure password will be generated and sent to the admin's email.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/platform/partners')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createPartner.isPending}>
                        {createPartner.isPending ? (
                            'Creating...'
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Partner
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
