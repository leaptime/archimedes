import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    TableFooter,
} from '@/components/ui/table';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Loader2,
    ChevronsUpDown,
    Check,
    GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
    id: number;
    name: string;
    company?: string;
    email?: string;
}

interface Product {
    id: number;
    name: string;
    code?: string;
    list_price: number;
    description_sale?: string;
}

interface Tax {
    id: number;
    name: string;
    amount: number;
    type: string;
}

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
}

interface PaymentTerm {
    id: number;
    name: string;
    days: number;
}

interface InvoiceLine {
    id?: number;
    tempId: string;
    product_id?: number;
    name: string;
    description?: string;
    quantity: number;
    price_unit: number;
    discount: number;
    tax_ids: number[];
    display_type: 'product' | 'line_section' | 'line_note';
}

interface InvoiceFormData {
    move_type: string;
    contact_id: number | null;
    ref: string;
    invoice_date: string;
    invoice_date_due: string;
    payment_term_id: number | null;
    currency_id: number | null;
    narration: string;
    lines: InvoiceLine[];
}

const MOVE_TYPES = [
    { value: 'out_invoice', label: 'Customer Invoice' },
    { value: 'out_refund', label: 'Credit Note' },
    { value: 'in_invoice', label: 'Vendor Bill' },
    { value: 'in_refund', label: 'Vendor Refund' },
];

export default function InvoiceFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEdit = id && id !== 'new';

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

    const [contactSearch, setContactSearch] = useState('');
    const [contactOpen, setContactOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const defaultMoveType = searchParams.get('type') || 'out_invoice';

    const [formData, setFormData] = useState<InvoiceFormData>({
        move_type: defaultMoveType,
        contact_id: null,
        ref: '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        invoice_date_due: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        payment_term_id: null,
        currency_id: null,
        narration: '',
        lines: [createEmptyLine()],
    });

    function createEmptyLine(): InvoiceLine {
        return {
            tempId: Math.random().toString(36).substr(2, 9),
            name: '',
            quantity: 1,
            price_unit: 0,
            discount: 0,
            tax_ids: [],
            display_type: 'product',
        };
    }

    useEffect(() => {
        loadData();
        if (isEdit) {
            loadInvoice();
        }
    }, [id]);

    const loadData = async () => {
        try {
            const [contactsRes, productsRes, taxesRes, currenciesRes, termsRes] = await Promise.all([
                fetch('/api/contacts?per_page=100&is_customer=true'),
                fetch('/api/products?sale_ok=true&per_page=100'),
                fetch('/api/invoices/taxes'),
                fetch('/api/invoices/currencies'),
                fetch('/api/payment-terms'),
            ]);

            const [contactsData, productsData, taxesData, currenciesData, termsData] = await Promise.all([
                contactsRes.json(),
                productsRes.json(),
                taxesRes.json(),
                currenciesRes.json(),
                termsRes.json(),
            ]);

            setContacts(contactsData.data || []);
            setProducts(productsData.data || []);
            setTaxes(taxesData.data || []);
            setCurrencies(currenciesData.data || []);
            setPaymentTerms(termsData.data || []);
        } catch (error) {
            console.error('Failed to load form data:', error);
        }
    };

    const loadInvoice = async () => {
        try {
            const response = await fetch(`/api/invoices/${id}?include=lines`);
            const data = await response.json();
            const invoice = data.data;

            setFormData({
                move_type: invoice.move_type,
                contact_id: invoice.contact_id,
                ref: invoice.ref || '',
                invoice_date: invoice.invoice_date || format(new Date(), 'yyyy-MM-dd'),
                invoice_date_due: invoice.invoice_date_due || '',
                payment_term_id: invoice.payment_term_id,
                currency_id: invoice.currency_id,
                narration: invoice.narration || '',
                lines: invoice.lines?.map((line: any) => ({
                    id: line.id,
                    tempId: Math.random().toString(36).substr(2, 9),
                    product_id: line.product_id,
                    name: line.name || line.description || '',
                    description: line.description,
                    quantity: line.quantity || 1,
                    price_unit: line.price_unit || line.unit_price || 0,
                    discount: line.discount || 0,
                    tax_ids: line.tax_ids || [],
                    display_type: line.display_type || 'product',
                })) || [createEmptyLine()],
            });
        } catch (error) {
            console.error('Failed to load invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContactChange = (contactId: number) => {
        setFormData({ ...formData, contact_id: contactId });
        setContactOpen(false);
    };

    const handlePaymentTermChange = (termId: string) => {
        const term = paymentTerms.find(t => t.id === parseInt(termId));
        const dueDate = term 
            ? format(new Date(Date.now() + term.days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
            : formData.invoice_date_due;
        
        setFormData({
            ...formData,
            payment_term_id: parseInt(termId),
            invoice_date_due: dueDate,
        });
    };

    const handleLineChange = (tempId: string, field: string, value: any) => {
        setFormData({
            ...formData,
            lines: formData.lines.map(line => 
                line.tempId === tempId ? { ...line, [field]: value } : line
            ),
        });
    };

    const handleProductSelect = (tempId: string, productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setFormData({
            ...formData,
            lines: formData.lines.map(line => 
                line.tempId === tempId 
                    ? {
                        ...line,
                        product_id: product.id,
                        name: product.name,
                        description: product.description_sale,
                        price_unit: product.list_price,
                    }
                    : line
            ),
        });
    };

    const addLine = (type: 'product' | 'line_section' | 'line_note' = 'product') => {
        setFormData({
            ...formData,
            lines: [...formData.lines, { ...createEmptyLine(), display_type: type }],
        });
    };

    const removeLine = (tempId: string) => {
        if (formData.lines.length <= 1) return;
        setFormData({
            ...formData,
            lines: formData.lines.filter(line => line.tempId !== tempId),
        });
    };

    const calculateLineTotal = (line: InvoiceLine): number => {
        const subtotal = line.quantity * line.price_unit * (1 - line.discount / 100);
        const taxAmount = line.tax_ids.reduce((acc, taxId) => {
            const tax = taxes.find(t => t.id === taxId);
            return acc + (tax ? subtotal * (tax.amount / 100) : 0);
        }, 0);
        return subtotal + taxAmount;
    };

    const calculateTotals = () => {
        const productLines = formData.lines.filter(l => l.display_type === 'product');
        const subtotal = productLines.reduce((acc, line) => 
            acc + (line.quantity * line.price_unit * (1 - line.discount / 100)), 0
        );
        const taxAmount = productLines.reduce((acc, line) => {
            const lineSubtotal = line.quantity * line.price_unit * (1 - line.discount / 100);
            return acc + line.tax_ids.reduce((taxAcc, taxId) => {
                const tax = taxes.find(t => t.id === taxId);
                return taxAcc + (tax ? lineSubtotal * (tax.amount / 100) : 0);
            }, 0);
        }, 0);
        return {
            subtotal,
            taxAmount,
            total: subtotal + taxAmount,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.contact_id) {
            alert('Please select a customer/vendor');
            return;
        }

        if (formData.lines.filter(l => l.display_type === 'product').length === 0) {
            alert('Please add at least one line item');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                lines: formData.lines.map(line => ({
                    id: line.id,
                    product_id: line.product_id,
                    name: line.name,
                    description: line.description,
                    quantity: line.quantity,
                    price_unit: line.price_unit,
                    discount: line.discount,
                    tax_ids: line.tax_ids,
                    display_type: line.display_type,
                })),
            };

            const response = await fetch(
                isEdit ? `/api/invoices/${id}` : '/api/invoices',
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (response.ok) {
                const data = await response.json();
                navigate(`/invoices/${data.data.id}`);
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save invoice');
            }
        } catch (error) {
            console.error('Failed to save invoice:', error);
            alert('Failed to save invoice');
        } finally {
            setSaving(false);
        }
    };

    const totals = calculateTotals();
    const selectedContact = contacts.find(c => c.id === formData.contact_id);
    const selectedCurrency = currencies.find(c => c.id === formData.currency_id);
    const currencySymbol = selectedCurrency?.symbol || '$';

    const formatCurrency = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    return (
        <DashboardLayout>
            <DashboardHeader
                title={isEdit ? 'Edit Invoice' : 'New Invoice'}
                backLink="/invoices"
            >
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
                        Cancel
                    </Button>
                    <Button type="submit" form="invoice-form" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </DashboardHeader>
            <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6 p-6">

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Move Type */}
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select
                                            value={formData.move_type}
                                            onValueChange={(value) => setFormData({ ...formData, move_type: value })}
                                            disabled={isEdit}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MOVE_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Reference */}
                                    <div className="space-y-2">
                                        <Label htmlFor="ref">Reference</Label>
                                        <Input
                                            id="ref"
                                            value={formData.ref}
                                            onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                                            placeholder="External reference..."
                                        />
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="space-y-2">
                                    <Label>{formData.move_type.includes('out') ? 'Customer' : 'Vendor'}</Label>
                                    <Popover open={contactOpen} onOpenChange={setContactOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={contactOpen}
                                                className="w-full justify-between"
                                            >
                                                {selectedContact?.name || 'Select contact...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput 
                                                    placeholder="Search contacts..." 
                                                    value={contactSearch}
                                                    onValueChange={setContactSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No contact found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {contacts
                                                            .filter(c => 
                                                                c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                                                                c.company?.toLowerCase().includes(contactSearch.toLowerCase())
                                                            )
                                                            .slice(0, 10)
                                                            .map((contact) => (
                                                                <CommandItem
                                                                    key={contact.id}
                                                                    value={contact.name}
                                                                    onSelect={() => handleContactChange(contact.id)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.contact_id === contact.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div>
                                                                        <div>{contact.name}</div>
                                                                        {contact.company && (
                                                                            <div className="text-xs text-muted-foreground">{contact.company}</div>
                                                                        )}
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {/* Invoice Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="invoice_date">Invoice Date</Label>
                                        <Input
                                            id="invoice_date"
                                            type="date"
                                            value={formData.invoice_date}
                                            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                                        />
                                    </div>

                                    {/* Payment Term */}
                                    <div className="space-y-2">
                                        <Label>Payment Terms</Label>
                                        <Select
                                            value={formData.payment_term_id?.toString() || ''}
                                            onValueChange={handlePaymentTermChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select term..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentTerms.map((term) => (
                                                    <SelectItem key={term.id} value={term.id.toString()}>
                                                        {term.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Due Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="invoice_date_due">Due Date</Label>
                                        <Input
                                            id="invoice_date_due"
                                            type="date"
                                            value={formData.invoice_date_due}
                                            onChange={(e) => setFormData({ ...formData, invoice_date_due: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lines */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Invoice Lines</CardTitle>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => addLine('line_section')}>
                                        Add Section
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => addLine('line_note')}>
                                        Add Note
                                    </Button>
                                    <Button type="button" size="sm" onClick={() => addLine('product')}>
                                        <Plus className="mr-1 h-4 w-4" />
                                        Add Line
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10"></TableHead>
                                            <TableHead className="w-[35%]">Product / Description</TableHead>
                                            <TableHead className="w-20 text-right">Qty</TableHead>
                                            <TableHead className="w-28 text-right">Price</TableHead>
                                            <TableHead className="w-20 text-right">Disc %</TableHead>
                                            <TableHead className="w-32">Tax</TableHead>
                                            <TableHead className="w-28 text-right">Total</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.lines.map((line, index) => (
                                            <TableRow key={line.tempId}>
                                                {line.display_type === 'product' ? (
                                                    <>
                                                        <TableCell>
                                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <Select
                                                                    value={line.product_id?.toString() || ''}
                                                                    onValueChange={(value) => handleProductSelect(line.tempId, parseInt(value))}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue placeholder="Select product..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {products.map((product) => (
                                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                                {product.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Input
                                                                    value={line.name}
                                                                    onChange={(e) => handleLineChange(line.tempId, 'name', e.target.value)}
                                                                    placeholder="Description"
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={line.quantity}
                                                                onChange={(e) => handleLineChange(line.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="h-8 text-right"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={line.price_unit}
                                                                onChange={(e) => handleLineChange(line.tempId, 'price_unit', parseFloat(e.target.value) || 0)}
                                                                className="h-8 text-right"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                value={line.discount}
                                                                onChange={(e) => handleLineChange(line.tempId, 'discount', parseFloat(e.target.value) || 0)}
                                                                className="h-8 text-right"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={line.tax_ids[0]?.toString() || 'none'}
                                                                onValueChange={(value) => handleLineChange(line.tempId, 'tax_ids', value && value !== 'none' ? [parseInt(value)] : [])}
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="No tax" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">No tax</SelectItem>
                                                                    {taxes.filter(t => t.type === 'percent').map((tax) => (
                                                                        <SelectItem key={tax.id} value={tax.id.toString()}>
                                                                            {tax.name} ({tax.amount}%)
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatCurrency(calculateLineTotal(line))}
                                                        </TableCell>
                                                    </>
                                                ) : line.display_type === 'line_section' ? (
                                                    <>
                                                        <TableCell></TableCell>
                                                        <TableCell colSpan={6}>
                                                            <Input
                                                                value={line.name}
                                                                onChange={(e) => handleLineChange(line.tempId, 'name', e.target.value)}
                                                                placeholder="Section title"
                                                                className="h-8 font-semibold"
                                                            />
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell></TableCell>
                                                        <TableCell colSpan={6}>
                                                            <Textarea
                                                                value={line.name}
                                                                onChange={(e) => handleLineChange(line.tempId, 'name', e.target.value)}
                                                                placeholder="Note..."
                                                                className="min-h-[60px] text-sm italic"
                                                            />
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeLine(line.tempId)}
                                                        disabled={formData.lines.length <= 1}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-right">Subtotal</TableCell>
                                            <TableCell className="text-right font-medium" colSpan={2}>
                                                {formatCurrency(totals.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-right text-muted-foreground">Tax</TableCell>
                                            <TableCell className="text-right" colSpan={2}>
                                                {formatCurrency(totals.taxAmount)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className="bg-muted/50">
                                            <TableCell colSpan={6} className="text-right font-semibold">Total</TableCell>
                                            <TableCell className="text-right font-bold text-lg" colSpan={2}>
                                                {formatCurrency(totals.total)}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes & Terms</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={formData.narration}
                                    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                                    placeholder="Add notes or payment terms..."
                                    className="min-h-[100px]"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(totals.taxAmount)}</span>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Currency */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Currency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={formData.currency_id?.toString() || ''}
                                    onValueChange={(value) => setFormData({ ...formData, currency_id: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Default currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem key={currency.id} value={currency.id.toString()}>
                                                {currency.code} - {currency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
