import { useState, useEffect } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePartnerProfile, useUpdatePartnerProfile, Partner } from '@/hooks/use-partner';
import { toast } from 'sonner';
import {
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    CreditCard,
    Percent,
    Save,
    Wallet,
    Banknote,
} from 'lucide-react';

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

const payoutMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Banknote },
    { value: 'paypal', label: 'PayPal', icon: Wallet },
    { value: 'stripe', label: 'Stripe', icon: CreditCard },
];

export default function PartnerSettings() {
    const { data, isLoading } = usePartnerProfile();
    const updateProfile = useUpdatePartnerProfile();
    
    const [formData, setFormData] = useState<Partial<Partner>>({});
    const [payoutDetails, setPayoutDetails] = useState<Record<string, string>>({});

    useEffect(() => {
        if (data?.partner) {
            setFormData(data.partner);
            setPayoutDetails(data.partner.payout_details || {});
        }
    }, [data]);

    const handleChange = (field: keyof Partner, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePayoutDetailChange = (field: string, value: string) => {
        setPayoutDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({
                ...formData,
                payout_details: payoutDetails,
            });
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </DashboardLayout>
        );
    }

    const partner = data?.partner;

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Partner Settings"
                subtitle="Manage your partner profile and payout settings"
            />

            <div className="p-6 space-y-6">
                {/* Status Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{partner?.name}</h2>
                                    <p className="text-muted-foreground">{partner?.code}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge className={
                                    partner?.status === 'active'
                                        ? 'bg-green-500/10 text-green-600'
                                        : 'bg-amber-500/10 text-amber-600'
                                }>
                                    {partner?.status}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <Percent className="w-4 h-4 inline mr-1" />
                                    {partner?.commission_rate}% commission
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="profile" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="payout">Payout Settings</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>Partner Profile</CardTitle>
                                <CardDescription>Update your business information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Partner Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name || ''}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="legal_name">Legal Name</Label>
                                        <Input
                                            id="legal_name"
                                            value={formData.legal_name || ''}
                                            onChange={(e) => handleChange('legal_name', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email || ''}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">Contact support to change email</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Phone
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone || ''}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">
                                            <Globe className="w-4 h-4 inline mr-2" />
                                            Website
                                        </Label>
                                        <Input
                                            id="website"
                                            value={formData.website || ''}
                                            onChange={(e) => handleChange('website', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="flex items-center gap-2 mb-4">
                                        <MapPin className="w-4 h-4" />
                                        Address
                                    </Label>
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="street">Street Address</Label>
                                            <Input
                                                id="street"
                                                value={formData.street || ''}
                                                onChange={(e) => handleChange('street', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="street2">Street Address 2</Label>
                                            <Input
                                                id="street2"
                                                value={formData.street2 || ''}
                                                onChange={(e) => handleChange('street2', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={formData.city || ''}
                                                onChange={(e) => handleChange('city', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State / Province</Label>
                                            <Input
                                                id="state"
                                                value={formData.state || ''}
                                                onChange={(e) => handleChange('state', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zip">ZIP / Postal Code</Label>
                                            <Input
                                                id="zip"
                                                value={formData.zip || ''}
                                                onChange={(e) => handleChange('zip', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Country</Label>
                                            <Select
                                                value={formData.country || 'US'}
                                                onValueChange={(v) => handleChange('country', v)}
                                            >
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
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={updateProfile.isPending}>
                                        {updateProfile.isPending ? 'Saving...' : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payout Tab */}
                    <TabsContent value="payout">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payout Settings</CardTitle>
                                <CardDescription>Configure how you receive your commission payments</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Commission Info */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Commission Rate</p>
                                        <p className="text-2xl font-bold">{partner?.commission_rate}%</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Minimum Payout</p>
                                        <p className="text-2xl font-bold">${partner?.minimum_payout}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Currency</p>
                                        <p className="text-2xl font-bold">{partner?.currency}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Payout Method */}
                                <div className="space-y-4">
                                    <Label>Payout Method</Label>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {payoutMethods.map((method) => {
                                            const isSelected = formData.payout_method === method.value;
                                            return (
                                                <div
                                                    key={method.value}
                                                    onClick={() => handleChange('payout_method', method.value)}
                                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <method.icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                        <span className="font-medium">{method.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Separator />

                                {/* Payout Details based on method */}
                                <div className="space-y-4">
                                    <Label>Payout Details</Label>
                                    
                                    {formData.payout_method === 'bank_transfer' && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_name">Bank Name</Label>
                                                <Input
                                                    id="bank_name"
                                                    value={payoutDetails.bank_name || ''}
                                                    onChange={(e) => handlePayoutDetailChange('bank_name', e.target.value)}
                                                    placeholder="e.g., Chase Bank"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="account_holder">Account Holder Name</Label>
                                                <Input
                                                    id="account_holder"
                                                    value={payoutDetails.account_holder || ''}
                                                    onChange={(e) => handlePayoutDetailChange('account_holder', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="account_number">Account Number</Label>
                                                <Input
                                                    id="account_number"
                                                    value={payoutDetails.account_number || ''}
                                                    onChange={(e) => handlePayoutDetailChange('account_number', e.target.value)}
                                                    placeholder="••••••••1234"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="routing_number">Routing Number / SWIFT</Label>
                                                <Input
                                                    id="routing_number"
                                                    value={payoutDetails.routing_number || ''}
                                                    onChange={(e) => handlePayoutDetailChange('routing_number', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="iban">IBAN (for international transfers)</Label>
                                                <Input
                                                    id="iban"
                                                    value={payoutDetails.iban || ''}
                                                    onChange={(e) => handlePayoutDetailChange('iban', e.target.value)}
                                                    placeholder="e.g., DE89370400440532013000"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.payout_method === 'paypal' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="paypal_email">PayPal Email</Label>
                                            <Input
                                                id="paypal_email"
                                                type="email"
                                                value={payoutDetails.paypal_email || ''}
                                                onChange={(e) => handlePayoutDetailChange('paypal_email', e.target.value)}
                                                placeholder="your-email@example.com"
                                            />
                                        </div>
                                    )}

                                    {formData.payout_method === 'stripe' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="stripe_account">Stripe Account ID</Label>
                                            <Input
                                                id="stripe_account"
                                                value={payoutDetails.stripe_account || ''}
                                                onChange={(e) => handlePayoutDetailChange('stripe_account', e.target.value)}
                                                placeholder="acct_..."
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Connect your Stripe account to receive instant payouts
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={updateProfile.isPending}>
                                        {updateProfile.isPending ? 'Saving...' : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Payout Settings
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
