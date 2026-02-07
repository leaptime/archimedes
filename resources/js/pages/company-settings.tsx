import { useState, useMemo } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Building2,
    CreditCard,
    Receipt,
    Globe,
    Mail,
    MapPin,
    FileText,
    Upload,
    Save,
    Trash2,
    Plus,
    CheckCircle2,
    Download,
    Package,
    Boxes,
    Users,
    HardDrive,
    Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useModules } from '@/hooks/use-modules';

interface CompanyData {
    // General Info
    name: string;
    legalName: string;
    taxId: string;
    vatNumber: string;
    companyRegistry: string;
    industry: string;
    // Contact
    email: string;
    phone: string;
    website: string;
    // Address
    street: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    // Billing Address (if different)
    useSeparateBillingAddress: boolean;
    billingStreet: string;
    billingCity: string;
    billingState: string;
    billingZip: string;
    billingCountry: string;
    // Preferences
    currency: string;
    timezone: string;
    dateFormat: string;
    fiscalYearStart: string;
}

interface ModulePricing {
    id: string;
    name: string;
    category: string;
    monthlyPrice: number;
    yearlyPrice: number;
    included: boolean; // Included in base plan
    active: boolean;
}

interface BillingData {
    billingCycle: 'monthly' | 'yearly';
    status: string;
    nextBillingDate: string;
    paymentMethod: string;
    cardLast4: string;
    cardBrand: string;
    basePrice: number;
    userCount: number;
    storageUsedGb: number;
    storageLimitGb: number;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    pdfUrl: string;
    breakdown: { item: string; amount: number }[];
}

const defaultCompanyData: CompanyData = {
    name: 'Archimedes Inc.',
    legalName: 'Archimedes Technologies Inc.',
    taxId: '',
    vatNumber: '',
    companyRegistry: '',
    industry: 'technology',
    email: 'contact@archimedes.io',
    phone: '+1 (555) 123-4567',
    website: 'https://archimedes.io',
    street: '123 Innovation Drive',
    street2: 'Suite 400',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    country: 'US',
    useSeparateBillingAddress: false,
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: '',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    fiscalYearStart: '01',
};

// Module pricing - some are free (core), some are paid
const modulePricing: ModulePricing[] = [
    { id: 'core', name: 'Core', category: 'Platform', monthlyPrice: 0, yearlyPrice: 0, included: true, active: true },
    { id: 'contacts', name: 'Contacts', category: 'CRM', monthlyPrice: 0, yearlyPrice: 0, included: true, active: true },
    { id: 'crm', name: 'CRM Pipeline', category: 'Sales', monthlyPrice: 29, yearlyPrice: 290, included: false, active: true },
    { id: 'invoicing', name: 'Invoicing', category: 'Finance', monthlyPrice: 19, yearlyPrice: 190, included: false, active: true },
    { id: 'banking', name: 'Banking', category: 'Finance', monthlyPrice: 39, yearlyPrice: 390, included: false, active: true },
    { id: 'cashbook', name: 'Cash Book', category: 'Finance', monthlyPrice: 15, yearlyPrice: 150, included: false, active: true },
    { id: 'l10n_it_edi', name: 'Italian E-Invoicing', category: 'Localization', monthlyPrice: 25, yearlyPrice: 250, included: false, active: true },
];

// Pricing tiers for users and storage
const userPricing = { freeUsers: 3, pricePerUser: 10 }; // $10/user/month after 3 free
const storagePricing = { freeGb: 5, pricePerGb: 2 }; // $2/GB/month after 5GB free

const defaultBillingData: BillingData = {
    billingCycle: 'monthly',
    status: 'active',
    nextBillingDate: '2026-03-01',
    paymentMethod: 'card',
    cardLast4: '4242',
    cardBrand: 'Visa',
    basePrice: 0, // Platform base is free
    userCount: 5,
    storageUsedGb: 3.2,
    storageLimitGb: 10,
};

const mockInvoices: Invoice[] = [
    { 
        id: 'INV-2026-002', 
        date: '2026-02-01', 
        amount: 147.00, 
        status: 'paid', 
        pdfUrl: '#',
        breakdown: [
            { item: 'CRM Pipeline', amount: 29 },
            { item: 'Invoicing', amount: 19 },
            { item: 'Banking', amount: 39 },
            { item: 'Cash Book', amount: 15 },
            { item: 'Italian E-Invoicing', amount: 25 },
            { item: 'Additional Users (2)', amount: 20 },
        ]
    },
    { 
        id: 'INV-2026-001', 
        date: '2026-01-01', 
        amount: 147.00, 
        status: 'paid', 
        pdfUrl: '#',
        breakdown: [
            { item: 'CRM Pipeline', amount: 29 },
            { item: 'Invoicing', amount: 19 },
            { item: 'Banking', amount: 39 },
            { item: 'Cash Book', amount: 15 },
            { item: 'Italian E-Invoicing', amount: 25 },
            { item: 'Additional Users (2)', amount: 20 },
        ]
    },
];

const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'services', label: 'Professional Services' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' },
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

const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Rome', label: 'Rome (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];



export default function CompanySettings() {
    const [companyData, setCompanyData] = useState<CompanyData>(defaultCompanyData);
    const [billingData, setBillingData] = useState<BillingData>(defaultBillingData);
    const [modules, setModules] = useState<ModulePricing[]>(modulePricing);
    const [invoices] = useState<Invoice[]>(mockInvoices);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Fetch actual modules from API
    const { data: installedModules } = useModules();

    // Calculate billing based on active modules
    const billingCalculation = useMemo(() => {
        const activeModules = modules.filter(m => m.active && !m.included);
        const isYearly = billingData.billingCycle === 'yearly';
        
        // Module costs
        const moduleCost = activeModules.reduce((sum, m) => 
            sum + (isYearly ? m.yearlyPrice : m.monthlyPrice), 0
        );

        // User costs (after free tier)
        const extraUsers = Math.max(0, billingData.userCount - userPricing.freeUsers);
        const userCost = extraUsers * userPricing.pricePerUser * (isYearly ? 10 : 1); // 10 months for yearly

        // Storage costs (after free tier)
        const extraStorage = Math.max(0, billingData.storageUsedGb - storagePricing.freeGb);
        const storageCost = Math.ceil(extraStorage) * storagePricing.pricePerGb * (isYearly ? 10 : 1);

        const subtotal = moduleCost + userCost + storageCost;
        const discount = isYearly ? subtotal * 0.167 : 0; // ~2 months free on yearly
        const total = subtotal - discount;

        return {
            activeModules,
            moduleCost,
            userCost,
            extraUsers,
            storageCost,
            extraStorage: Math.ceil(extraStorage),
            subtotal,
            discount,
            total,
            isYearly,
        };
    }, [modules, billingData]);

    const toggleModule = (moduleId: string) => {
        setModules(prev => prev.map(m => 
            m.id === moduleId && !m.included 
                ? { ...m, active: !m.active }
                : m
        ));
    };

    const handleCompanyChange = (field: keyof CompanyData, value: string | boolean) => {
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        toast.success('Company settings saved successfully');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            toast.success('Logo uploaded. Save to apply changes.');
        }
    };

    return (
        <DashboardLayout>
            <DashboardHeader 
                title="Company Settings" 
                subtitle="Manage your company information and billing" 
            />
            <div className="p-6">
                <Tabs defaultValue="company" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="company" className="gap-2">
                            <Building2 className="w-4 h-4" />
                            Company Info
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="gap-2">
                            <CreditCard className="w-4 h-4" />
                            Billing & Plans
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="gap-2">
                            <Receipt className="w-4 h-4" />
                            Invoices
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="gap-2">
                            <Globe className="w-4 h-4" />
                            Preferences
                        </TabsTrigger>
                    </TabsList>

                    {/* Company Information Tab */}
                    <TabsContent value="company" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Logo & Basic Info */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Company Profile</CardTitle>
                                    <CardDescription>Basic information about your company</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Logo Upload */}
                                    <div className="flex items-start gap-6">
                                        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                            {logoFile ? (
                                                <img 
                                                    src={URL.createObjectURL(logoFile)} 
                                                    alt="Company logo" 
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            ) : (
                                                <Building2 className="w-10 h-10 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Company Logo</Label>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                PNG, JPG up to 2MB. Recommended: 256x256px
                                            </p>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <label className="cursor-pointer">
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            className="hidden" 
                                                            onChange={handleLogoUpload}
                                                        />
                                                    </label>
                                                </Button>
                                                {logoFile && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setLogoFile(null)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Company Names */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Company Name</Label>
                                            <Input
                                                id="name"
                                                value={companyData.name}
                                                onChange={(e) => handleCompanyChange('name', e.target.value)}
                                                placeholder="Display name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="legalName">Legal Name</Label>
                                            <Input
                                                id="legalName"
                                                value={companyData.legalName}
                                                onChange={(e) => handleCompanyChange('legalName', e.target.value)}
                                                placeholder="Full legal company name"
                                            />
                                        </div>
                                    </div>

                                    {/* Tax & Legal */}
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">Tax ID / EIN</Label>
                                            <Input
                                                id="taxId"
                                                value={companyData.taxId}
                                                onChange={(e) => handleCompanyChange('taxId', e.target.value)}
                                                placeholder="XX-XXXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vatNumber">VAT Number</Label>
                                            <Input
                                                id="vatNumber"
                                                value={companyData.vatNumber}
                                                onChange={(e) => handleCompanyChange('vatNumber', e.target.value)}
                                                placeholder="e.g., IT12345678901"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="companyRegistry">Company Registry #</Label>
                                            <Input
                                                id="companyRegistry"
                                                value={companyData.companyRegistry}
                                                onChange={(e) => handleCompanyChange('companyRegistry', e.target.value)}
                                                placeholder="Registry number"
                                            />
                                        </div>
                                    </div>

                                    {/* Industry */}
                                    <div className="space-y-2">
                                        <Label>Industry</Label>
                                        <Select 
                                            value={companyData.industry} 
                                            onValueChange={(v) => handleCompanyChange('industry', v)}
                                        >
                                            <SelectTrigger className="w-full md:w-[300px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industries.map((ind) => (
                                                    <SelectItem key={ind.value} value={ind.value}>
                                                        {ind.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Information */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={companyData.email}
                                                onChange={(e) => handleCompanyChange('email', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={companyData.phone}
                                                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website</Label>
                                            <Input
                                                id="website"
                                                value={companyData.website}
                                                onChange={(e) => handleCompanyChange('website', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Address */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Company Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="street">Street Address</Label>
                                            <Input
                                                id="street"
                                                value={companyData.street}
                                                onChange={(e) => handleCompanyChange('street', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="street2">Street Address 2</Label>
                                            <Input
                                                id="street2"
                                                value={companyData.street2}
                                                onChange={(e) => handleCompanyChange('street2', e.target.value)}
                                                placeholder="Suite, Floor, etc."
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={companyData.city}
                                                onChange={(e) => handleCompanyChange('city', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State / Province</Label>
                                            <Input
                                                id="state"
                                                value={companyData.state}
                                                onChange={(e) => handleCompanyChange('state', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zip">ZIP / Postal Code</Label>
                                            <Input
                                                id="zip"
                                                value={companyData.zip}
                                                onChange={(e) => handleCompanyChange('zip', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Country</Label>
                                            <Select 
                                                value={companyData.country} 
                                                onValueChange={(v) => handleCompanyChange('country', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {countries.map((c) => (
                                                        <SelectItem key={c.value} value={c.value}>
                                                            {c.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Billing Address Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Use different billing address</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Enable if your billing address differs from company address
                                            </p>
                                        </div>
                                        <Switch
                                            checked={companyData.useSeparateBillingAddress}
                                            onCheckedChange={(v) => handleCompanyChange('useSeparateBillingAddress', v)}
                                        />
                                    </div>

                                    {companyData.useSeparateBillingAddress && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-4 pt-4"
                                        >
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Billing Street</Label>
                                                    <Input
                                                        value={companyData.billingStreet}
                                                        onChange={(e) => handleCompanyChange('billingStreet', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Billing City</Label>
                                                    <Input
                                                        value={companyData.billingCity}
                                                        onChange={(e) => handleCompanyChange('billingCity', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>State / Province</Label>
                                                    <Input
                                                        value={companyData.billingState}
                                                        onChange={(e) => handleCompanyChange('billingState', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>ZIP / Postal Code</Label>
                                                    <Input
                                                        value={companyData.billingZip}
                                                        onChange={(e) => handleCompanyChange('billingZip', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Country</Label>
                                                    <Select 
                                                        value={companyData.billingCountry} 
                                                        onValueChange={(v) => handleCompanyChange('billingCountry', v)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map((c) => (
                                                                <SelectItem key={c.value} value={c.value}>
                                                                    {c.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </TabsContent>

                    {/* Billing & Plans Tab */}
                    <TabsContent value="billing" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Billing Summary */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Billing Summary</CardTitle>
                                            <CardDescription>Pay only for what you use</CardDescription>
                                        </div>
                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Active
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Billing Cycle Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className={billingData.billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
                                                Monthly
                                            </span>
                                            <Switch
                                                checked={billingData.billingCycle === 'yearly'}
                                                onCheckedChange={(yearly) => setBillingData(prev => ({ 
                                                    ...prev, 
                                                    billingCycle: yearly ? 'yearly' : 'monthly' 
                                                }))}
                                            />
                                            <span className={billingData.billingCycle === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
                                                Yearly
                                            </span>
                                            {billingData.billingCycle === 'yearly' && (
                                                <Badge className="bg-green-500/10 text-green-600 ml-2">
                                                    Save ~17%
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Next billing: {new Date(billingData.nextBillingDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-lg border border-primary/20">
                                        <div>
                                            <h3 className="text-lg font-semibold">Total {billingCalculation.isYearly ? 'Yearly' : 'Monthly'} Cost</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {billingCalculation.activeModules.length} paid modules, {billingData.userCount} users
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {billingCalculation.discount > 0 && (
                                                <p className="text-sm text-muted-foreground line-through">
                                                    ${billingCalculation.subtotal.toFixed(2)}
                                                </p>
                                            )}
                                            <p className="text-3xl font-bold">
                                                ${billingCalculation.total.toFixed(2)}
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    /{billingCalculation.isYearly ? 'year' : 'month'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Active Modules */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Boxes className="w-5 h-5" />
                                        Modules
                                    </CardTitle>
                                    <CardDescription>
                                        Enable or disable modules to adjust your billing. Core modules are always free.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Module</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">
                                                    {billingCalculation.isYearly ? 'Yearly' : 'Monthly'} Price
                                                </TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {modules.map((module) => (
                                                <TableRow key={module.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-muted-foreground" />
                                                            {module.name}
                                                            {module.included && (
                                                                <Badge variant="outline" className="text-xs">Core</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {module.category}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {module.included ? (
                                                            <span className="text-green-600">Free</span>
                                                        ) : (
                                                            <span>
                                                                ${billingCalculation.isYearly ? module.yearlyPrice : module.monthlyPrice}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {module.included ? (
                                                            <Badge className="bg-green-500/10 text-green-600">Included</Badge>
                                                        ) : (
                                                            <Switch
                                                                checked={module.active}
                                                                onCheckedChange={() => toggleModule(module.id)}
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                                        <span className="text-sm font-medium">Module Total</span>
                                        <span className="font-semibold">
                                            ${billingCalculation.moduleCost.toFixed(2)}
                                            <span className="text-sm text-muted-foreground font-normal">
                                                /{billingCalculation.isYearly ? 'year' : 'month'}
                                            </span>
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Users & Storage */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Users className="w-5 h-5" />
                                            Users
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Current users</span>
                                            <span className="font-semibold">{billingData.userCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Free included</span>
                                            <span>{userPricing.freeUsers}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Extra users ({billingCalculation.extraUsers} × ${userPricing.pricePerUser})
                                            </span>
                                            <span className="font-semibold">
                                                ${billingCalculation.userCost.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            ${userPricing.pricePerUser}/user/month after {userPricing.freeUsers} free
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <HardDrive className="w-5 h-5" />
                                            Storage
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Used</span>
                                                <span>{billingData.storageUsedGb.toFixed(1)} GB of {billingData.storageLimitGb} GB</span>
                                            </div>
                                            <Progress value={(billingData.storageUsedGb / billingData.storageLimitGb) * 100} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Free included</span>
                                            <span>{storagePricing.freeGb} GB</span>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Extra storage ({billingCalculation.extraStorage} GB × ${storagePricing.pricePerGb})
                                            </span>
                                            <span className="font-semibold">
                                                ${billingCalculation.storageCost.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            ${storagePricing.pricePerGb}/GB/month after {storagePricing.freeGb}GB free
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                                                {billingData.cardBrand}
                                            </div>
                                            <div>
                                                <p className="font-medium">•••• •••• •••• {billingData.cardLast4}</p>
                                                <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Update
                                        </Button>
                                    </div>
                                    <div className="mt-4">
                                        <Button variant="outline" size="sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Payment Method
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="w-5 h-5" />
                                        Billing History
                                    </CardTitle>
                                    <CardDescription>Download invoices with detailed module breakdown</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {invoices.map((invoice) => (
                                            <div 
                                                key={invoice.id}
                                                className="border rounded-lg overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{invoice.id}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(invoice.date).toLocaleDateString('en-US', { 
                                                                    year: 'numeric', 
                                                                    month: 'long', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                                                            <Badge 
                                                                variant="outline" 
                                                                className={invoice.status === 'paid' 
                                                                    ? 'text-green-600 border-green-500/30' 
                                                                    : 'text-amber-600 border-amber-500/30'
                                                                }
                                                            >
                                                                {invoice.status}
                                                            </Badge>
                                                        </div>
                                                        <Button variant="ghost" size="icon">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {/* Breakdown */}
                                                <div className="px-4 py-3 bg-background border-t">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Breakdown</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {invoice.breakdown.map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between text-sm">
                                                                <span className="text-muted-foreground">{item.item}</span>
                                                                <span>${item.amount.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Regional Settings</CardTitle>
                                    <CardDescription>Configure your regional preferences</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Default Currency</Label>
                                            <Select 
                                                value={companyData.currency} 
                                                onValueChange={(v) => handleCompanyChange('currency', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies.map((c) => (
                                                        <SelectItem key={c.value} value={c.value}>
                                                            {c.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <Select 
                                                value={companyData.timezone} 
                                                onValueChange={(v) => handleCompanyChange('timezone', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timezones.map((tz) => (
                                                        <SelectItem key={tz.value} value={tz.value}>
                                                            {tz.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Date Format</Label>
                                            <Select 
                                                value={companyData.dateFormat} 
                                                onValueChange={(v) => handleCompanyChange('dateFormat', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fiscal Year Starts</Label>
                                            <Select 
                                                value={companyData.fiscalYearStart} 
                                                onValueChange={(v) => handleCompanyChange('fiscalYearStart', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="01">January</SelectItem>
                                                    <SelectItem value="04">April</SelectItem>
                                                    <SelectItem value="07">July</SelectItem>
                                                    <SelectItem value="10">October</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Preferences
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
