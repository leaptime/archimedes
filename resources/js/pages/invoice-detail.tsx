import React, { useState, useEffect } from 'react';
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
    TableFooter,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    Send,
    CheckCircle2,
    XCircle,
    Copy,
    FileText,
    DollarSign,
    Printer,
    Download,
    Edit,
    RotateCcw,
    CreditCard,
    Clock,
    Building,
    Mail,
    Phone,
    MapPin,
    Loader2,
    MoreHorizontal,
    Eye,
} from 'lucide-react';
import { ExtensionPoint, DetailExtensionSlot } from '@/components/modules';

interface InvoiceLine {
    id: number;
    name: string;
    description?: string;
    quantity: number;
    price_unit: number;
    discount: number;
    tax_ids: number[];
    tax_amount: number;
    price_subtotal: number;
    price_total: number;
    display_type: string;
    product?: {
        id: number;
        name: string;
    };
}

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference?: string;
}

interface TaxLine {
    id: number;
    tax_name: string;
    tax_rate: number;
    base: number;
    amount: number;
}

interface Invoice {
    id: number;
    number: string;
    ref?: string;
    move_type: string;
    state: string;
    payment_state: string;
    contact: {
        id: number;
        name: string;
        company?: string;
        email?: string;
        phone?: string;
        street?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
        vat?: string;
    };
    invoice_date: string;
    invoice_date_due: string;
    sent_at?: string;
    paid_at?: string;
    amount_untaxed: number;
    amount_tax: number;
    amount_total: number;
    amount_residual: number;
    amount_paid: number;
    currency?: {
        code: string;
        symbol: string;
    };
    lines: InvoiceLine[];
    payments: Payment[];
    taxLines: TaxLine[];
    narration?: string;
    origin?: string;
    invoice_origin?: string;
    user?: {
        id: number;
        name: string;
    };
}

const MOVE_TYPE_LABELS: Record<string, string> = {
    out_invoice: 'Customer Invoice',
    out_refund: 'Credit Note',
    in_invoice: 'Vendor Bill',
    in_refund: 'Vendor Refund',
};

const STATE_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    posted: { label: 'Posted', variant: 'default' },
    cancel: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_STATE_CONFIG: Record<string, { label: string; className: string }> = {
    not_paid: { label: 'Not Paid', className: 'bg-yellow-100 text-yellow-800' },
    partial: { label: 'Partially Paid', className: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    in_payment: { label: 'In Payment', className: 'bg-purple-100 text-purple-800' },
    reversed: { label: 'Reversed', className: 'bg-gray-100 text-gray-800' },
};

const PAYMENT_METHODS: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    cash: 'Cash',
    check: 'Check',
    other: 'Other',
};

export default function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailForm, setEmailForm] = useState({
        recipient_email: '',
        message: '',
        attach_pdf: true,
    });
    const [emailSending, setEmailSending] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method: 'bank_transfer',
        reference: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        loadInvoice();
    }, [id]);

    useEffect(() => {
        if (searchParams.get('action') === 'payment' && invoice?.state === 'posted') {
            setShowPaymentDialog(true);
        }
    }, [searchParams, invoice]);

    const loadInvoice = async () => {
        try {
            const response = await fetch(`/api/invoices/${id}?include=lines,payments,taxLines`);
            const data = await response.json();
            setInvoice(data.data);
            
            // Pre-fill payment amount with remaining balance
            if (data.data?.amount_residual > 0) {
                setPaymentForm(prev => ({
                    ...prev,
                    amount: data.data.amount_residual.toString(),
                }));
            }
        } catch (error) {
            console.error('Failed to load invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string) => {
        setActionLoading(action);
        try {
            const response = await fetch(`/api/invoices/${id}/${action}`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                if (action === 'duplicate' || action === 'credit-note') {
                    navigate(`/invoices/${data.data.id}`);
                } else {
                    loadInvoice();
                }
            }
        } catch (error) {
            console.error(`Failed to ${action}:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRegisterPayment = async () => {
        setActionLoading('payment');
        try {
            const response = await fetch(`/api/invoices/${id}/register-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(paymentForm.amount),
                    payment_method: paymentForm.payment_method,
                    reference: paymentForm.reference || null,
                    payment_date: paymentForm.payment_date,
                }),
            });

            if (response.ok) {
                setShowPaymentDialog(false);
                loadInvoice();
            }
        } catch (error) {
            console.error('Failed to register payment:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await fetch(`/api/invoices/${id}/pdf`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoice?.number || 'invoice'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Failed to download PDF:', error);
        }
    };

    const handleViewPdf = () => {
        window.open(`/api/invoices/${id}/pdf/view`, '_blank');
    };

    const handlePrint = () => {
        window.open(`/api/invoices/${id}/pdf/view`, '_blank');
    };

    const handleSendEmail = async () => {
        setEmailSending(true);
        try {
            const response = await fetch(`/api/invoices/${id}/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_email: emailForm.recipient_email || undefined,
                    message: emailForm.message || undefined,
                    attach_pdf: emailForm.attach_pdf,
                }),
            });

            if (response.ok) {
                setShowEmailDialog(false);
                setEmailForm({ recipient_email: '', message: '', attach_pdf: true });
                loadInvoice();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to send email');
            }
        } catch (error) {
            console.error('Failed to send email:', error);
        } finally {
            setEmailSending(false);
        }
    };

    const openEmailDialog = () => {
        setEmailForm({
            recipient_email: invoice?.contact?.email || '',
            message: '',
            attach_pdf: true,
        });
        setShowEmailDialog(true);
    };

    const formatCurrency = (amount: number) => {
        const symbol = invoice?.currency?.symbol || '$';
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    if (!invoice) {
        return (
            <DashboardLayout>
                <div className="flex h-96 flex-col items-center justify-center">
                    <p className="text-muted-foreground">Invoice not found</p>
                    <Button variant="link" onClick={() => navigate('/invoices')}>
                        Back to Invoices
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const isOverdue = invoice.state === 'posted' &&
        invoice.payment_state !== 'paid' &&
        new Date(invoice.invoice_date_due) < new Date();

    return (
        <DashboardLayout>
            <DashboardHeader
                title={invoice.number || `Draft ${MOVE_TYPE_LABELS[invoice.move_type]}`}
                subtitle={MOVE_TYPE_LABELS[invoice.move_type]}
                backLink="/invoices"
            >
                <div className="flex items-center gap-2">
                    <Badge variant={STATE_CONFIG[invoice.state]?.variant}>
                        {STATE_CONFIG[invoice.state]?.label}
                    </Badge>
                    {invoice.state === 'posted' && (
                        <Badge className={PAYMENT_STATE_CONFIG[invoice.payment_state]?.className}>
                            {PAYMENT_STATE_CONFIG[invoice.payment_state]?.label}
                        </Badge>
                    )}
                    {isOverdue && (
                        <Badge variant="destructive">Overdue</Badge>
                    )}
                </div>
            </DashboardHeader>
            <div className="space-y-6 p-6">
                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                        {invoice.ref && `Ref: ${invoice.ref}`}
                    </p>
                    <div className="flex gap-2">
                        {invoice.state === 'draft' && (
                            <>
                                <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button onClick={() => handleAction('post')} disabled={actionLoading === 'post'}>
                                    {actionLoading === 'post' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                    )}
                                    Confirm
                                </Button>
                            </>
                        )}
                        {invoice.state === 'posted' && (
                            <>
                                <Button variant="outline" onClick={openEmailDialog}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                </Button>
                                {invoice.payment_state !== 'paid' && (
                                    <Button onClick={() => setShowPaymentDialog(true)}>
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Register Payment
                                    </Button>
                                )}
                                {invoice.move_type.includes('invoice') && (
                                    <Button variant="outline" onClick={() => handleAction('credit-note')} disabled={actionLoading === 'credit-note'}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Credit Note
                                    </Button>
                                )}
                            </>
                        )}
                        {invoice.state === 'cancel' && (
                            <Button variant="outline" onClick={() => handleAction('reset-to-draft')}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset to Draft
                            </Button>
                        )}
                        
                        {/* PDF & More Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleViewPdf}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownloadPdf}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAction('duplicate')}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Invoice Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Partner & Dates */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Partner Info */}
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                            {invoice.move_type.includes('out') ? 'Customer' : 'Vendor'}
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="font-semibold text-lg">{invoice.contact?.name}</p>
                                            {invoice.contact?.company && (
                                                <p className="flex items-center gap-2 text-sm">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    {invoice.contact.company}
                                                </p>
                                            )}
                                            {invoice.contact?.email && (
                                                <p className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {invoice.contact.email}
                                                </p>
                                            )}
                                            {invoice.contact?.phone && (
                                                <p className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    {invoice.contact.phone}
                                                </p>
                                            )}
                                            {invoice.contact?.street && (
                                                <p className="flex items-start gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <span>
                                                        {invoice.contact.street}
                                                        {invoice.contact.city && `, ${invoice.contact.city}`}
                                                        {invoice.contact.postal_code && ` ${invoice.contact.postal_code}`}
                                                    </span>
                                                </p>
                                            )}
                                            {invoice.contact?.vat && (
                                                <p className="text-sm">
                                                    <span className="text-muted-foreground">VAT:</span> {invoice.contact.vat}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dates & Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Invoice Date</p>
                                            <p className="font-medium">
                                                {invoice.invoice_date && format(new Date(invoice.invoice_date), 'MMMM d, yyyy')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Due Date</p>
                                            <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                                {invoice.invoice_date_due && format(new Date(invoice.invoice_date_due), 'MMMM d, yyyy')}
                                                {isOverdue && ' (Overdue)'}
                                            </p>
                                        </div>
                                        {invoice.origin && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Origin</p>
                                                <p className="font-medium">{invoice.origin}</p>
                                            </div>
                                        )}
                                        {invoice.sent_at && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Sent</p>
                                                <p className="font-medium">
                                                    {format(new Date(invoice.sent_at), 'MMMM d, yyyy')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lines */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Lines</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Description</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Disc %</TableHead>
                                            <TableHead className="text-right">Tax</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.lines?.filter(l => l.display_type === 'product').map((line) => (
                                            <TableRow key={line.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{line.name || line.product?.name}</p>
                                                        {line.description && line.description !== line.name && (
                                                            <p className="text-sm text-muted-foreground">{line.description}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{line.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(line.price_unit)}</TableCell>
                                                <TableCell className="text-right">
                                                    {line.discount > 0 ? `${line.discount}%` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(line.tax_amount)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(line.price_subtotal)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {invoice.lines?.filter(l => l.display_type === 'line_section').map((line) => (
                                            <TableRow key={line.id} className="bg-muted/30">
                                                <TableCell colSpan={6} className="font-semibold">
                                                    {line.name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {invoice.lines?.filter(l => l.display_type === 'line_note').map((line) => (
                                            <TableRow key={line.id}>
                                                <TableCell colSpan={6} className="text-muted-foreground italic">
                                                    {line.name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-right">Subtotal</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(invoice.amount_untaxed)}
                                            </TableCell>
                                        </TableRow>
                                        {invoice.taxLines?.map((tax) => (
                                            <TableRow key={tax.id}>
                                                <TableCell colSpan={5} className="text-right text-muted-foreground">
                                                    {tax.tax_name} ({tax.tax_rate}%)
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(tax.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50">
                                            <TableCell colSpan={5} className="text-right font-semibold">Total</TableCell>
                                            <TableCell className="text-right font-bold text-lg">
                                                {formatCurrency(invoice.amount_total)}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {invoice.narration && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{invoice.narration}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Summary & Payments */}
                    <div className="space-y-6">
                        {/* Amount Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(invoice.amount_untaxed)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(invoice.amount_tax)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(invoice.amount_total)}</span>
                                </div>
                                {invoice.state === 'posted' && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between text-green-600">
                                            <span>Paid</span>
                                            <span>{formatCurrency(invoice.amount_paid)}</span>
                                        </div>
                                        <div className={`flex justify-between font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                                            <span>Amount Due</span>
                                            <span>{formatCurrency(invoice.amount_residual)}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payments */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Payments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {invoice.payments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                                        {' • '}
                                                        {PAYMENT_METHODS[payment.payment_method] || payment.payment_method}
                                                    </p>
                                                    {payment.reference && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Ref: {payment.reference}
                                                        </p>
                                                    )}
                                                </div>
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <span>Created</span>
                                        <span className="ml-auto text-muted-foreground">
                                            {invoice.invoice_date && format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    {invoice.state !== 'draft' && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>Posted</span>
                                        </div>
                                    )}
                                    {invoice.sent_at && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                                            <span>Sent</span>
                                            <span className="ml-auto text-muted-foreground">
                                                {format(new Date(invoice.sent_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                    {invoice.paid_at && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span>Paid</span>
                                            <span className="ml-auto text-muted-foreground">
                                                {format(new Date(invoice.paid_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Extension point for additional sidebar content (e.g., Italian EDI panel) */}
                        <DetailExtensionSlot
                            name="invoices.detail.sidebar"
                            entity={invoice}
                            onRefresh={loadInvoice}
                        />
                    </div>
                </div>

                {/* Extension point for full-width content below main grid */}
                <DetailExtensionSlot
                    name="invoices.detail.below"
                    entity={invoice}
                    onRefresh={loadInvoice}
                    className="mt-6"
                />
            </div>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Register Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            />
                            <p className="text-sm text-muted-foreground">
                                Outstanding: {formatCurrency(invoice.amount_residual)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_date">Payment Date</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={paymentForm.payment_date}
                                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select
                                value={paymentForm.payment_method}
                                onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reference">Reference (optional)</Label>
                            <Input
                                id="reference"
                                value={paymentForm.reference}
                                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                placeholder="Check number, transaction ID..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRegisterPayment} disabled={actionLoading === 'payment'}>
                            {actionLoading === 'payment' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Register Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Invoice by Email</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipient_email">Recipient Email</Label>
                            <Input
                                id="recipient_email"
                                type="email"
                                value={emailForm.recipient_email}
                                onChange={(e) => setEmailForm({ ...emailForm, recipient_email: e.target.value })}
                                placeholder="customer@example.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave blank to use the contact's email address
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Custom Message (optional)</Label>
                            <Textarea
                                id="message"
                                value={emailForm.message}
                                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                                placeholder="Add a personal message to the email..."
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="attach_pdf"
                                checked={emailForm.attach_pdf}
                                onChange={(e) => setEmailForm({ ...emailForm, attach_pdf: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="attach_pdf" className="text-sm font-normal">
                                Attach PDF invoice
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendEmail} disabled={emailSending}>
                            {emailSending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Send Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
