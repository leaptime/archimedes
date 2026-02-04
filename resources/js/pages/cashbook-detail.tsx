import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    ArrowDownCircle,
    ArrowUpCircle,
    ArrowLeftRight,
    CheckCircle,
    XCircle,
    Link as LinkIcon,
    Trash2,
    Loader2,
    Building,
    CreditCard,
    Calendar,
    FileText,
    Edit,
    Wand2,
} from 'lucide-react';

interface Allocation {
    id: number;
    invoice_id: number;
    amount_applied: number;
    invoice: {
        id: number;
        number: string;
        move_type: string;
        amount_total: number;
        amount_paid: number;
        invoice_date_due: string;
        contact?: { name: string };
    };
}

interface CashBookEntry {
    id: number;
    number: string;
    date: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency_code: string;
    payment_method: string;
    description: string;
    reference?: string;
    notes?: string;
    contact?: { id: number; name: string };
    bank_account?: { id: number; name: string };
    bank_transaction?: { id: number; description: string };
    state: 'draft' | 'confirmed' | 'reconciled' | 'cancelled';
    amount_allocated: number;
    amount_unallocated: number;
    is_fully_allocated: boolean;
    allocations: Allocation[];
    confirmed_at?: string;
    confirmed_by?: { name: string };
    created_at: string;
}

interface OpenInvoice {
    id: number;
    number: string;
    move_type: string;
    contact: string;
    invoice_date: string;
    invoice_date_due: string;
    amount_total: number;
    amount_paid: number;
    amount_due: number;
    currency_code: string;
}

const TYPE_CONFIG = {
    income: { label: 'Income', icon: ArrowDownCircle, color: 'text-green-600' },
    expense: { label: 'Expense', icon: ArrowUpCircle, color: 'text-red-600' },
    transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600' },
};

const STATE_CONFIG = {
    draft: { label: 'Draft', variant: 'secondary' as const },
    confirmed: { label: 'Confirmed', variant: 'default' as const },
    reconciled: { label: 'Reconciled', variant: 'outline' as const },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    credit_card: 'Credit Card',
    direct_debit: 'Direct Debit',
    other: 'Other',
};

export default function CashBookDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [entry, setEntry] = useState<CashBookEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Allocation dialog
    const [showAllocationDialog, setShowAllocationDialog] = useState(false);
    const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<Record<number, number>>({});
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    useEffect(() => {
        loadEntry();
    }, [id]);

    useEffect(() => {
        if (searchParams.get('action') === 'allocate' && entry?.state === 'confirmed') {
            openAllocationDialog();
        }
    }, [searchParams, entry]);

    const loadEntry = async () => {
        try {
            const response = await fetch(`/api/cashbook/${id}`);
            const data = await response.json();
            setEntry(data.data);
        } catch (error) {
            console.error('Failed to load entry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setActionLoading('confirm');
        try {
            await fetch(`/api/cashbook/${id}/confirm`, { method: 'POST' });
            loadEntry();
        } catch (error) {
            console.error('Failed to confirm:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        setActionLoading('cancel');
        try {
            await fetch(`/api/cashbook/${id}/cancel`, { method: 'POST' });
            loadEntry();
        } catch (error) {
            console.error('Failed to cancel:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const openAllocationDialog = async () => {
        setShowAllocationDialog(true);
        setLoadingInvoices(true);
        try {
            const params = new URLSearchParams();
            if (entry?.contact?.id) {
                params.set('contact_id', entry.contact.id.toString());
            }
            params.set('type', entry?.type || 'income');
            
            const response = await fetch(`/api/cashbook/open-invoices?${params}`);
            const data = await response.json();
            setOpenInvoices(data.data || []);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleAllocate = async () => {
        const allocations = Object.entries(selectedInvoices)
            .filter(([_, amount]) => amount > 0)
            .map(([invoiceId, amount]) => ({ invoice_id: parseInt(invoiceId), amount }));

        if (allocations.length === 0) return;

        setActionLoading('allocate');
        try {
            await fetch(`/api/cashbook/${id}/allocate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allocations }),
            });
            setShowAllocationDialog(false);
            setSelectedInvoices({});
            loadEntry();
        } catch (error) {
            console.error('Failed to allocate:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAutoAllocate = async () => {
        setActionLoading('auto-allocate');
        try {
            await fetch(`/api/cashbook/${id}/auto-allocate`, { method: 'POST' });
            loadEntry();
        } catch (error) {
            console.error('Failed to auto-allocate:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveAllocation = async (allocationId: number) => {
        try {
            await fetch(`/api/cashbook/${id}/allocations/${allocationId}`, { method: 'DELETE' });
            loadEntry();
        } catch (error) {
            console.error('Failed to remove allocation:', error);
        }
    };

    const formatCurrency = (amount: number, currency = 'EUR') => {
        const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    const getTotalSelected = () => {
        return Object.values(selectedInvoices).reduce((sum, amount) => sum + (amount || 0), 0);
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

    if (!entry) {
        return (
            <DashboardLayout>
                <div className="flex h-96 flex-col items-center justify-center">
                    <p className="text-muted-foreground">Entry not found</p>
                    <Button variant="link" onClick={() => navigate('/cashbook')}>
                        Back to Cash Book
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const TypeIcon = TYPE_CONFIG[entry.type].icon;

    return (
        <DashboardLayout>
            <DashboardHeader
                title={entry.number}
                subtitle={TYPE_CONFIG[entry.type].label}
                backLink="/cashbook"
            >
                <div className="flex items-center gap-2">
                    <Badge variant={STATE_CONFIG[entry.state].variant}>
                        {STATE_CONFIG[entry.state].label}
                    </Badge>
                </div>
            </DashboardHeader>

            <div className="space-y-6 p-6">
                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TypeIcon className={`h-5 w-5 ${TYPE_CONFIG[entry.type].color}`} />
                        <span className="text-2xl font-bold">
                            {entry.type === 'expense' ? '-' : ''}{formatCurrency(entry.amount, entry.currency_code)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {entry.state === 'draft' && (
                            <>
                                <Button variant="outline" onClick={() => navigate(`/cashbook/${id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button onClick={handleConfirm} disabled={actionLoading === 'confirm'}>
                                    {actionLoading === 'confirm' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Confirm
                                </Button>
                            </>
                        )}
                        {entry.state === 'confirmed' && (
                            <>
                                {!entry.is_fully_allocated && entry.contact && (
                                    <Button 
                                        variant="outline" 
                                        onClick={handleAutoAllocate}
                                        disabled={actionLoading === 'auto-allocate'}
                                    >
                                        {actionLoading === 'auto-allocate' ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Wand2 className="mr-2 h-4 w-4" />
                                        )}
                                        Auto Allocate
                                    </Button>
                                )}
                                {!entry.is_fully_allocated && (
                                    <Button onClick={openAllocationDialog}>
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        Allocate to Invoices
                                    </Button>
                                )}
                            </>
                        )}
                        {['draft', 'confirmed'].includes(entry.state) && (
                            <Button 
                                variant="outline" 
                                onClick={handleCancel}
                                disabled={actionLoading === 'cancel'}
                            >
                                {actionLoading === 'cancel' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Entry Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-muted-foreground">Date</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {format(new Date(entry.date), 'dd MMMM yyyy')}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Payment Method</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                            {PAYMENT_METHOD_LABELS[entry.payment_method]}
                                        </div>
                                    </div>
                                    {entry.contact && (
                                        <div>
                                            <Label className="text-muted-foreground">Contact</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                {entry.contact.name}
                                            </div>
                                        </div>
                                    )}
                                    {entry.bank_account && (
                                        <div>
                                            <Label className="text-muted-foreground">Bank Account</Label>
                                            <div className="mt-1">{entry.bank_account.name}</div>
                                        </div>
                                    )}
                                    {entry.reference && (
                                        <div>
                                            <Label className="text-muted-foreground">Reference</Label>
                                            <div className="mt-1">{entry.reference}</div>
                                        </div>
                                    )}
                                </div>
                                
                                <Separator />
                                
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <div className="mt-1">{entry.description}</div>
                                </div>
                                
                                {entry.notes && (
                                    <div>
                                        <Label className="text-muted-foreground">Notes</Label>
                                        <div className="mt-1 text-sm text-muted-foreground">{entry.notes}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Allocations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Invoice Allocations</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {formatCurrency(entry.amount_allocated, entry.currency_code)} of {formatCurrency(entry.amount, entry.currency_code)} allocated
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {entry.allocations.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Invoice Total</TableHead>
                                                <TableHead className="text-right">Applied</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entry.allocations.map((allocation) => (
                                                <TableRow key={allocation.id}>
                                                    <TableCell>
                                                        <button
                                                            className="text-primary hover:underline"
                                                            onClick={() => navigate(`/invoices/${allocation.invoice_id}`)}
                                                        >
                                                            {allocation.invoice.number}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        {allocation.invoice.invoice_date_due && 
                                                            format(new Date(allocation.invoice.invoice_date_due), 'dd/MM/yyyy')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(allocation.invoice.amount_total, entry.currency_code)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(allocation.amount_applied, entry.currency_code)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.state === 'confirmed' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveAllocation(allocation.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                        <p>No invoices allocated yet</p>
                                        {entry.state === 'confirmed' && !entry.is_fully_allocated && (
                                            <Button 
                                                variant="link" 
                                                className="mt-2"
                                                onClick={openAllocationDialog}
                                            >
                                                Allocate to invoices
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Allocation Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Amount</span>
                                    <span className="font-medium">{formatCurrency(entry.amount, entry.currency_code)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Allocated</span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(entry.amount_allocated, entry.currency_code)}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Unallocated</span>
                                    <span className={`font-medium ${entry.amount_unallocated > 0 ? 'text-amber-600' : ''}`}>
                                        {formatCurrency(entry.amount_unallocated, entry.currency_code)}
                                    </span>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 transition-all"
                                        style={{ width: `${(entry.amount_allocated / entry.amount) * 100}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>History</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Created:</span>
                                    <div>{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}</div>
                                </div>
                                {entry.confirmed_at && (
                                    <div>
                                        <span className="text-muted-foreground">Confirmed:</span>
                                        <div>{format(new Date(entry.confirmed_at), 'dd/MM/yyyy HH:mm')}</div>
                                        {entry.confirmed_by && (
                                            <div className="text-muted-foreground">by {entry.confirmed_by.name}</div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Allocation Dialog */}
            <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Allocate to Invoices</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span>Available to allocate:</span>
                            <span className="font-medium">{formatCurrency(entry.amount_unallocated, entry.currency_code)}</span>
                        </div>
                        
                        {loadingInvoices ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : openInvoices.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">Amount Due</TableHead>
                                            <TableHead className="text-right w-32">Allocate</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openInvoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">{invoice.number}</TableCell>
                                                <TableCell>{invoice.contact}</TableCell>
                                                <TableCell>
                                                    {invoice.invoice_date_due && 
                                                        format(new Date(invoice.invoice_date_due), 'dd/MM/yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(invoice.amount_due, invoice.currency_code)}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={Math.min(invoice.amount_due, entry.amount_unallocated - getTotalSelected() + (selectedInvoices[invoice.id] || 0))}
                                                        step="0.01"
                                                        value={selectedInvoices[invoice.id] || ''}
                                                        onChange={(e) => {
                                                            const value = parseFloat(e.target.value) || 0;
                                                            setSelectedInvoices(prev => ({
                                                                ...prev,
                                                                [invoice.id]: value
                                                            }));
                                                        }}
                                                        className="w-28 text-right"
                                                        placeholder="0.00"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No open invoices found for this contact</p>
                            </div>
                        )}
                        
                        <div className="flex justify-between font-medium border-t pt-4">
                            <span>Total to allocate:</span>
                            <span className={getTotalSelected() > entry.amount_unallocated ? 'text-red-600' : ''}>
                                {formatCurrency(getTotalSelected(), entry.currency_code)}
                            </span>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAllocationDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAllocate}
                            disabled={getTotalSelected() === 0 || getTotalSelected() > entry.amount_unallocated || actionLoading === 'allocate'}
                        >
                            {actionLoading === 'allocate' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Allocate {formatCurrency(getTotalSelected(), entry.currency_code)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
