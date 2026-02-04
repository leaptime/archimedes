import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
    Plus, 
    CreditCard, 
    Edit, 
    Trash2, 
    Building2,
    Globe,
} from 'lucide-react';

export interface BankAccount {
    id?: number;
    acc_number: string;
    acc_holder_name?: string;
    bank_name?: string;
    bank_bic?: string;
    country_id?: number;
    active?: boolean;
}

interface BankAccountManagerProps {
    accounts: BankAccount[];
    onAdd: (account: Omit<BankAccount, 'id'>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    countries?: Array<{ id: number; name: string; code: string }>;
    readonly?: boolean;
}

function maskAccountNumber(num: string): string {
    if (num.length <= 4) return num;
    return '*'.repeat(num.length - 4) + num.slice(-4);
}

function BankAccountCard({
    account,
    onDelete,
    countries,
    readonly,
}: {
    account: BankAccount;
    onDelete: () => void;
    countries?: Array<{ id: number; name: string }>;
    readonly?: boolean;
}) {
    const country = countries?.find(c => c.id === account.country_id);

    return (
        <div className="p-4 border border-border rounded-lg hover:border-primary/20 transition-colors group">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">
                                {maskAccountNumber(account.acc_number)}
                            </span>
                            {account.bank_bic && (
                                <Badge variant="outline" className="text-xs font-mono">
                                    {account.bank_bic}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {account.bank_name && (
                                <div className="flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {account.bank_name}
                                </div>
                            )}
                            {country && (
                                <div className="flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5" />
                                    {country.name}
                                </div>
                            )}
                        </div>
                        {account.acc_holder_name && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Holder: {account.acc_holder_name}
                            </p>
                        )}
                    </div>
                </div>

                {!readonly && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

function BankAccountFormDialog({
    open,
    onOpenChange,
    onSave,
    countries,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: Omit<BankAccount, 'id'>) => void;
    countries?: Array<{ id: number; name: string }>;
}) {
    const [formData, setFormData] = useState<Omit<BankAccount, 'id'>>({
        acc_number: '',
    });

    React.useEffect(() => {
        if (open) {
            setFormData({ acc_number: '' });
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.acc_number.trim()) return;
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Bank Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Account Number / IBAN *</Label>
                        <Input
                            value={formData.acc_number}
                            onChange={(e) => setFormData({ ...formData, acc_number: e.target.value })}
                            placeholder="e.g., DE89370400440532013000"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Account Holder Name</Label>
                        <Input
                            value={formData.acc_holder_name || ''}
                            onChange={(e) => setFormData({ ...formData, acc_holder_name: e.target.value })}
                            placeholder="Name on the account"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input
                                value={formData.bank_name || ''}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                placeholder="e.g., Deutsche Bank"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>BIC / SWIFT</Label>
                            <Input
                                value={formData.bank_bic || ''}
                                onChange={(e) => setFormData({ ...formData, bank_bic: e.target.value.toUpperCase() })}
                                placeholder="e.g., DEUTDEFF"
                                maxLength={11}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                            value={formData.country_id?.toString() || ''}
                            onValueChange={(v) => setFormData({ ...formData, country_id: v ? parseInt(v) : undefined })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {countries?.map((country) => (
                                    <SelectItem key={country.id} value={country.id.toString()}>
                                        {country.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Bank Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function BankAccountManager({
    accounts,
    onAdd,
    onDelete,
    countries,
    readonly = false,
}: BankAccountManagerProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleSave = async (data: Omit<BankAccount, 'id'>) => {
        await onAdd(data);
    };

    const handleDelete = async (account: BankAccount) => {
        if (account.id && confirm('Are you sure you want to delete this bank account?')) {
            await onDelete(account.id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Bank Accounts</h3>
                {!readonly && (
                    <Button size="sm" onClick={() => setDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bank Account
                    </Button>
                )}
            </div>

            {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No bank accounts added yet</p>
                    {!readonly && (
                        <Button variant="link" onClick={() => setDialogOpen(true)}>
                            Add your first bank account
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <BankAccountCard
                            key={account.id || account.acc_number}
                            account={account}
                            onDelete={() => handleDelete(account)}
                            countries={countries}
                            readonly={readonly}
                        />
                    ))}
                </div>
            )}

            <BankAccountFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                countries={countries}
            />
        </div>
    );
}
