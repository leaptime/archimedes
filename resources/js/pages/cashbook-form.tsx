import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    ArrowLeftRight,
    Save,
    Loader2,
} from 'lucide-react';

interface Contact {
    id: number;
    name: string;
}

interface BankAccount {
    id: number;
    name: string;
    account_number: string;
}

interface FormData {
    date: string;
    type: 'income' | 'expense' | 'transfer';
    amount: string;
    currency_code: string;
    payment_method: string;
    description: string;
    reference: string;
    notes: string;
    contact_id: string;
    bank_account_id: string;
}

export default function CashBookForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    
    const [form, setForm] = useState<FormData>({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'income',
        amount: '',
        currency_code: 'EUR',
        payment_method: 'bank_transfer',
        description: '',
        reference: '',
        notes: '',
        contact_id: '',
        bank_account_id: '',
    });

    useEffect(() => {
        loadReferenceData();
        if (isEditing) {
            loadEntry();
        }
    }, [id]);

    const loadReferenceData = async () => {
        try {
            const [contactsRes, accountsRes] = await Promise.all([
                fetch('/api/contacts?per_page=100'),
                fetch('/api/banking/accounts'),
            ]);
            
            const contactsData = await contactsRes.json();
            const accountsData = await accountsRes.json();
            
            setContacts(contactsData.data || []);
            setBankAccounts(accountsData.data || []);
        } catch (error) {
            console.error('Failed to load reference data:', error);
        }
    };

    const loadEntry = async () => {
        try {
            const response = await fetch(`/api/cashbook/${id}`);
            const data = await response.json();
            const entry = data.data;
            
            setForm({
                date: entry.date,
                type: entry.type,
                amount: entry.amount.toString(),
                currency_code: entry.currency_code,
                payment_method: entry.payment_method,
                description: entry.description,
                reference: entry.reference || '',
                notes: entry.notes || '',
                contact_id: entry.contact_id?.toString() || '',
                bank_account_id: entry.bank_account_id?.toString() || '',
            });
        } catch (error) {
            console.error('Failed to load entry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...form,
                amount: parseFloat(form.amount),
                contact_id: form.contact_id ? parseInt(form.contact_id) : null,
                bank_account_id: form.bank_account_id ? parseInt(form.bank_account_id) : null,
            };

            const url = isEditing ? `/api/cashbook/${id}` : '/api/cashbook';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/cashbook/${data.data.id}`);
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save entry');
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateForm = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
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
                title={isEditing ? 'Edit Entry' : 'New Entry'}
                subtitle="Cash Book"
                backLink="/cashbook"
            />

            <form onSubmit={handleSubmit} className="p-6">
                <div className="max-w-2xl space-y-6">
                    {/* Type Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Entry Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => updateForm('type', 'income')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                        form.type === 'income' 
                                            ? 'border-green-500 bg-green-50' 
                                            : 'border-transparent bg-secondary hover:border-muted-foreground'
                                    }`}
                                >
                                    <ArrowDownCircle className={`h-8 w-8 ${form.type === 'income' ? 'text-green-600' : 'text-muted-foreground'}`} />
                                    <span className={form.type === 'income' ? 'font-medium text-green-700' : ''}>Income</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateForm('type', 'expense')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                        form.type === 'expense' 
                                            ? 'border-red-500 bg-red-50' 
                                            : 'border-transparent bg-secondary hover:border-muted-foreground'
                                    }`}
                                >
                                    <ArrowUpCircle className={`h-8 w-8 ${form.type === 'expense' ? 'text-red-600' : 'text-muted-foreground'}`} />
                                    <span className={form.type === 'expense' ? 'font-medium text-red-700' : ''}>Expense</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateForm('type', 'transfer')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                        form.type === 'transfer' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-transparent bg-secondary hover:border-muted-foreground'
                                    }`}
                                >
                                    <ArrowLeftRight className={`h-8 w-8 ${form.type === 'transfer' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                    <span className={form.type === 'transfer' ? 'font-medium text-blue-700' : ''}>Transfer</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => updateForm('date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={form.amount}
                                            onChange={(e) => updateForm('amount', e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="flex-1"
                                        />
                                        <Select value={form.currency_code} onValueChange={(v) => updateForm('currency_code', v)}>
                                            <SelectTrigger className="w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="GBP">GBP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Input
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => updateForm('description', e.target.value)}
                                    placeholder="Payment description"
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Payment Method *</Label>
                                    <Select value={form.payment_method} onValueChange={(v) => updateForm('payment_method', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                            <SelectItem value="direct_debit">Direct Debit</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={form.reference}
                                        onChange={(e) => updateForm('reference', e.target.value)}
                                        placeholder="Check number, transaction ID..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact & Account */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact & Account</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_id">Contact</Label>
                                    <Select 
                                        value={form.contact_id || 'none'} 
                                        onValueChange={(v) => updateForm('contact_id', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select contact..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {contacts.map((contact) => (
                                                <SelectItem key={contact.id} value={contact.id.toString()}>
                                                    {contact.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Link to a customer or supplier for allocation
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_account_id">Bank Account</Label>
                                    <Select 
                                        value={form.bank_account_id || 'none'} 
                                        onValueChange={(v) => updateForm('bank_account_id', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {bankAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={form.notes}
                                onChange={(e) => updateForm('notes', e.target.value)}
                                placeholder="Additional notes..."
                                rows={3}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/cashbook')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isEditing ? 'Update Entry' : 'Create Entry'}
                        </Button>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
