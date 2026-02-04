import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Landmark,
    Search,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    ExternalLink,
    AlertCircle,
    Globe,
} from 'lucide-react';

interface Provider {
    id: string;
    name: string;
    countries: string[];
    configured: boolean;
}

interface Institution {
    id: string;
    name: string;
    logo?: string;
    bic?: string;
    countries?: string[];
}

interface BankAccount {
    id: number;
    name: string;
}

interface BankConnectionWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bankAccounts: BankAccount[];
    onConnectionComplete: () => void;
}

type Step = 'provider' | 'country' | 'institution' | 'account' | 'connecting' | 'complete';

const COUNTRY_NAMES: Record<string, string> = {
    AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia', CY: 'Cyprus',
    CZ: 'Czech Republic', DK: 'Denmark', EE: 'Estonia', FI: 'Finland', FR: 'France',
    DE: 'Germany', GR: 'Greece', HU: 'Hungary', IS: 'Iceland', IE: 'Ireland',
    IT: 'Italy', LV: 'Latvia', LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg',
    MT: 'Malta', NL: 'Netherlands', NO: 'Norway', PL: 'Poland', PT: 'Portugal',
    RO: 'Romania', SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain', SE: 'Sweden',
    GB: 'United Kingdom', CH: 'Switzerland', US: 'United States', CA: 'Canada',
};

export function BankConnectionWizard({
    open,
    onOpenChange,
    bankAccounts,
    onConnectionComplete,
}: BankConnectionWizardProps) {
    const [step, setStep] = useState<Step>('provider');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Selections
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Connection result
    const [authUrl, setAuthUrl] = useState<string | null>(null);
    const [linkToken, setLinkToken] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadProviders();
        }
    }, [open]);

    useEffect(() => {
        if (selectedProvider && selectedCountry) {
            loadInstitutions();
        }
    }, [selectedProvider, selectedCountry]);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/banking/open-banking/providers');
            const data = await response.json();
            setProviders(data.data.filter((p: Provider) => p.configured));
        } catch (err) {
            setError('Failed to load providers');
        } finally {
            setLoading(false);
        }
    };

    const loadInstitutions = async () => {
        if (!selectedProvider) return;

        setLoading(true);
        setInstitutions([]);
        try {
            const response = await fetch(
                `/api/banking/open-banking/institutions/${selectedProvider.id}?country=${selectedCountry}`
            );
            const data = await response.json();
            setInstitutions(data.data || []);
        } catch (err) {
            setError('Failed to load institutions');
        } finally {
            setLoading(false);
        }
    };

    const initiateConnection = async () => {
        if (!selectedProvider || !selectedInstitution || !selectedAccount) return;

        setLoading(true);
        setError(null);
        setStep('connecting');

        try {
            const redirectUri = `${window.location.origin}/banking/callback`;

            const response = await fetch('/api/banking/open-banking/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: selectedProvider.id,
                    institution_id: selectedInstitution.id,
                    bank_account_id: parseInt(selectedAccount),
                    redirect_uri: redirectUri,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate connection');
            }

            // Store pending connection data for callback
            sessionStorage.setItem('pending_bank_connection', JSON.stringify({
                provider: selectedProvider.id,
                bank_account_id: parseInt(selectedAccount),
                institution_id: selectedInstitution.id,
                institution_name: selectedInstitution.name,
                requisition_id: data.data.requisition_id,
            }));

            if (data.data.is_link_token) {
                // Plaid uses Link SDK
                setLinkToken(data.data.authorization_url);
                // In a real implementation, you'd initialize Plaid Link here
                setStep('complete');
            } else {
                // GoCardless uses redirect
                setAuthUrl(data.data.authorization_url);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            setStep('account');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('provider');
        setSelectedProvider(null);
        setSelectedCountry('');
        setSelectedInstitution(null);
        setSelectedAccount('');
        setSearchTerm('');
        setError(null);
        setAuthUrl(null);
        setLinkToken(null);
        onOpenChange(false);
    };

    const filteredInstitutions = institutions.filter((inst) =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableCountries = selectedProvider?.countries || [];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Connect Bank Account</DialogTitle>
                    <DialogDescription>
                        Connect your bank for automatic transaction sync
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Step 1: Select Provider */}
                {step === 'provider' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Select your Open Banking provider
                        </p>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : providers.length === 0 ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No providers configured. Please add API credentials in Settings.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-2">
                                {providers.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => {
                                            setSelectedProvider(provider);
                                            setStep('country');
                                        }}
                                        className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <Landmark className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{provider.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {provider.countries.length} countries supported
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Country */}
                {step === 'country' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Select your country
                        </p>

                        <ScrollArea className="h-[300px]">
                            <div className="space-y-1">
                                {availableCountries.map((code) => (
                                    <button
                                        key={code}
                                        onClick={() => {
                                            setSelectedCountry(code);
                                            setStep('institution');
                                        }}
                                        className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-muted"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            <span>{COUNTRY_NAMES[code] || code}</span>
                                        </div>
                                        <Badge variant="outline">{code}</Badge>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Step 3: Select Institution */}
                {step === 'institution' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search banks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-1">
                                    {filteredInstitutions.map((institution) => (
                                        <button
                                            key={institution.id}
                                            onClick={() => {
                                                setSelectedInstitution(institution);
                                                setStep('account');
                                            }}
                                            className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted"
                                        >
                                            {institution.logo ? (
                                                <img
                                                    src={institution.logo}
                                                    alt={institution.name}
                                                    className="h-8 w-8 rounded object-contain"
                                                />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                                    <Landmark className="h-4 w-4" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">{institution.name}</p>
                                                {institution.bic && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {institution.bic}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    {filteredInstitutions.length === 0 && (
                                        <p className="py-8 text-center text-muted-foreground">
                                            No banks found
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                )}

                {/* Step 4: Select Account */}
                {step === 'account' && (
                    <div className="space-y-4">
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                                {selectedInstitution?.logo ? (
                                    <img
                                        src={selectedInstitution.logo}
                                        alt={selectedInstitution.name}
                                        className="h-10 w-10 rounded object-contain"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                        <Landmark className="h-5 w-5" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">{selectedInstitution?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        via {selectedProvider?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Link to Account</Label>
                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Transactions will be imported into this account
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 5: Connecting */}
                {step === 'connecting' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-lg font-medium">Connecting to your bank...</p>
                        <p className="text-sm text-muted-foreground">
                            You'll be redirected to authorize access
                        </p>
                    </div>
                )}

                {/* Auth URL Ready */}
                {authUrl && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center py-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="mt-4 text-lg font-medium">Ready to Connect</p>
                            <p className="text-center text-sm text-muted-foreground">
                                Click the button below to authorize access to your bank account
                            </p>
                        </div>

                        <Button className="w-full" asChild>
                            <a href={authUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Authorize Bank Access
                            </a>
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                            After authorization, return here and refresh the page
                        </p>
                    </div>
                )}

                {/* Step 6: Complete (for Plaid) */}
                {step === 'complete' && linkToken && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center py-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="mt-4 text-lg font-medium">Connection Initiated</p>
                            <p className="text-center text-sm text-muted-foreground">
                                Complete the authorization in the popup window
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step !== 'provider' && step !== 'connecting' && !authUrl && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (step === 'country') setStep('provider');
                                else if (step === 'institution') setStep('country');
                                else if (step === 'account') setStep('institution');
                            }}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    )}

                    {step === 'account' && !authUrl && (
                        <Button onClick={initiateConnection} disabled={!selectedAccount || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Connect
                        </Button>
                    )}

                    {(authUrl || step === 'complete') && (
                        <Button variant="outline" onClick={handleClose}>
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default BankConnectionWizard;
