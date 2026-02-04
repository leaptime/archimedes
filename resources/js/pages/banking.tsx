import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Landmark,
    Plus,
    Upload,
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Wallet,
    FileText,
    Settings,
    Link2,
} from 'lucide-react';
import { TransactionList } from '@modules/banking/frontend/components/TransactionList';
import { ImportWizard } from '@modules/banking/frontend/components/ImportWizard';
import { ReconciliationPanel } from '@modules/banking/frontend/components/ReconciliationPanel';
import { BankConnectionWizard } from '@modules/banking/frontend/components/BankConnectionWizard';
import { ConnectionStatus } from '@modules/banking/frontend/components/ConnectionStatus';

interface BankAccount {
    id: number;
    name: string;
    account_number?: string;
    bank_name?: string;
    account_type: string;
    currency_code: string;
    current_balance: number;
    unreconciled_count?: number;
    to_check_count?: number;
}

interface Transaction {
    id: number;
    date: string;
    payment_ref: string;
    partner_name?: string;
    amount: number;
    currency_code: string;
    running_balance?: number;
    is_reconciled: boolean;
    checked: boolean;
    bank_account?: { name: string };
}

interface Connection {
    id: number;
    provider: string;
    institution_name: string;
    institution_logo?: string;
    status: string;
    display_status: string;
    is_active: boolean;
    is_expired: boolean;
    last_sync_at?: string;
    next_sync_at?: string;
    expires_at?: string;
    error_message?: string;
    sync_enabled: boolean;
}

interface DashboardData {
    accounts: BankAccount[];
    summary: {
        total_balance: number;
        total_unreconciled: number;
        total_to_check: number;
        account_count: number;
    };
    recent_transactions: Transaction[];
}

export default function Banking() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [showNewAccount, setShowNewAccount] = useState(false);
    const [showConnectionWizard, setShowConnectionWizard] = useState(false);
    const [reconcileTransaction, setReconcileTransaction] = useState<Transaction | null>(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [newAccountData, setNewAccountData] = useState({
        name: '',
        account_number: '',
        bank_name: '',
        account_type: 'bank',
        currency_code: 'EUR',
    });

    useEffect(() => {
        loadDashboard();
        loadConnections();
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [selectedAccount]);

    const loadDashboard = async () => {
        try {
            const response = await fetch('/api/banking/dashboard');
            const data = await response.json();
            setDashboardData(data.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadConnections = async () => {
        try {
            const response = await fetch('/api/banking/open-banking/connections');
            const data = await response.json();
            setConnections(data.data || []);
        } catch (error) {
            console.error('Failed to load connections:', error);
        }
    };

    const handleSyncConnection = async (connectionId: number) => {
        const response = await fetch(`/api/banking/open-banking/connections/${connectionId}/sync`, {
            method: 'POST',
        });
        if (response.ok) {
            loadDashboard();
            loadTransactions();
            loadConnections();
        }
    };

    const handleDisconnectConnection = async (connectionId: number) => {
        const response = await fetch(`/api/banking/open-banking/connections/${connectionId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            loadConnections();
            loadDashboard();
        }
    };

    const handleToggleSync = async (connectionId: number, enabled: boolean) => {
        const response = await fetch(`/api/banking/open-banking/connections/${connectionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sync_enabled: enabled }),
        });
        if (response.ok) {
            loadConnections();
        }
    };

    const loadTransactions = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedAccount !== 'all') {
                params.set('account_id', selectedAccount);
            }
            params.set('is_reconciled', 'false');
            params.set('per_page', '50');

            const response = await fetch(`/api/banking/transactions?${params}`);
            const data = await response.json();
            setTransactions(data.data || []);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    };

    const handleCreateAccount = async () => {
        try {
            const response = await fetch('/api/banking/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccountData),
            });

            if (response.ok) {
                setShowNewAccount(false);
                setNewAccountData({
                    name: '',
                    account_number: '',
                    bank_name: '',
                    account_type: 'bank',
                    currency_code: 'EUR',
                });
                loadDashboard();
            }
        } catch (error) {
            console.error('Failed to create account:', error);
        }
    };

    const handleImport = async (accountId: number, file: File, format?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (format) {
            formData.append('format', format);
        }

        const response = await fetch(`/api/banking/accounts/${accountId}/import`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Import failed');
        }

        const result = await response.json();
        loadDashboard();
        loadTransactions();
        return result.data;
    };

    const handlePreview = async (file: File, format?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (format) {
            formData.append('format', format);
        }

        const response = await fetch('/api/banking/import/preview', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Preview failed');
        }

        const result = await response.json();
        return result.data;
    };

    const handleReconcile = async (transactionId: number, matches: any[]) => {
        const response = await fetch(`/api/banking/transactions/${transactionId}/reconcile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matches }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Reconciliation failed');
        }

        loadDashboard();
        loadTransactions();
    };

    const fetchSuggestions = async (transactionId: number) => {
        const response = await fetch(`/api/banking/transactions/${transactionId}/suggestions`);
        const data = await response.json();
        return data.data || [];
    };

    const handleAutoReconcile = async () => {
        if (selectedAccount === 'all') return;

        try {
            const response = await fetch(`/api/banking/accounts/${selectedAccount}/auto-reconcile`, {
                method: 'POST',
            });

            if (response.ok) {
                loadDashboard();
                loadTransactions();
            }
        } catch (error) {
            console.error('Auto-reconcile failed:', error);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex h-96 items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Banking" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Banking</h1>
                        <p className="text-muted-foreground">
                            Manage bank accounts, import transactions, and reconcile payments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowConnectionWizard(true)}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Connect Bank
                        </Button>
                        <Button variant="outline" onClick={() => setShowImportWizard(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button onClick={() => setShowNewAccount(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Account
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                {dashboardData && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(dashboardData.summary.total_balance)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Across {dashboardData.summary.account_count} accounts
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">To Reconcile</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dashboardData.summary.total_unreconciled}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Unreconciled transactions
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">To Check</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dashboardData.summary.total_to_check}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Need verification
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Accounts</CardTitle>
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dashboardData.summary.account_count}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Active bank accounts
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Bank Connections */}
                {connections.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Connected Banks</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {connections.map((connection) => (
                                <ConnectionStatus
                                    key={connection.id}
                                    connection={connection}
                                    onSync={handleSyncConnection}
                                    onDisconnect={handleDisconnectConnection}
                                    onToggleSync={handleToggleSync}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Bank Accounts */}
                {dashboardData && dashboardData.accounts.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-3">
                        {dashboardData.accounts.map((account) => (
                            <Card key={account.id} className="overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{account.name}</CardTitle>
                                        <Badge variant="outline">
                                            {account.account_type === 'bank'
                                                ? 'Bank'
                                                : account.account_type === 'cash'
                                                ? 'Cash'
                                                : 'Credit Card'}
                                        </Badge>
                                    </div>
                                    {account.bank_name && (
                                        <CardDescription>{account.bank_name}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(account.current_balance, account.currency_code)}
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm">
                                        {account.unreconciled_count !== undefined &&
                                            account.unreconciled_count > 0 && (
                                                <span className="text-yellow-600">
                                                    {account.unreconciled_count} to reconcile
                                                </span>
                                            )}
                                        {account.to_check_count !== undefined &&
                                            account.to_check_count > 0 && (
                                                <span className="text-orange-600">
                                                    {account.to_check_count} to check
                                                </span>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Transactions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Transactions to Reconcile</CardTitle>
                                <CardDescription>
                                    Match bank transactions with invoices and payments
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="All accounts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Accounts</SelectItem>
                                        {dashboardData?.accounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedAccount !== 'all' && (
                                    <Button variant="outline" onClick={handleAutoReconcile}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Auto-Reconcile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TransactionList
                            transactions={transactions}
                            showAccount={selectedAccount === 'all'}
                            onReconcile={(tx) => setReconcileTransaction(tx)}
                            onViewDetails={(tx) => console.log('View details:', tx)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Bank Connection Wizard */}
            <BankConnectionWizard
                open={showConnectionWizard}
                onOpenChange={setShowConnectionWizard}
                bankAccounts={dashboardData?.accounts || []}
                onConnectionComplete={() => {
                    loadConnections();
                    loadDashboard();
                    loadTransactions();
                }}
            />

            {/* Import Wizard */}
            <ImportWizard
                open={showImportWizard}
                onOpenChange={setShowImportWizard}
                accounts={dashboardData?.accounts || []}
                onImport={handleImport}
                onPreview={handlePreview}
            />

            {/* Reconciliation Panel */}
            <ReconciliationPanel
                open={!!reconcileTransaction}
                onOpenChange={(open) => !open && setReconcileTransaction(null)}
                transaction={reconcileTransaction}
                onReconcile={handleReconcile}
                onFetchSuggestions={fetchSuggestions}
            />

            {/* New Account Dialog */}
            <Dialog open={showNewAccount} onOpenChange={setShowNewAccount}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Bank Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                                value={newAccountData.name}
                                onChange={(e) =>
                                    setNewAccountData({ ...newAccountData, name: e.target.value })
                                }
                                placeholder="My Bank Account"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input
                                value={newAccountData.account_number}
                                onChange={(e) =>
                                    setNewAccountData({
                                        ...newAccountData,
                                        account_number: e.target.value,
                                    })
                                }
                                placeholder="IBAN or account number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input
                                value={newAccountData.bank_name}
                                onChange={(e) =>
                                    setNewAccountData({ ...newAccountData, bank_name: e.target.value })
                                }
                                placeholder="Bank name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Account Type</Label>
                                <Select
                                    value={newAccountData.account_type}
                                    onValueChange={(value) =>
                                        setNewAccountData({ ...newAccountData, account_type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank">Bank Account</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select
                                    value={newAccountData.currency_code}
                                    onValueChange={(value) =>
                                        setNewAccountData({ ...newAccountData, currency_code: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="CHF">CHF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewAccount(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateAccount} disabled={!newAccountData.name}>
                            Create Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
