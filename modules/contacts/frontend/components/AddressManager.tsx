import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { 
    Plus, 
    MapPin, 
    Edit, 
    Trash2, 
    FileText, 
    Truck, 
    Home,
    MoreHorizontal,
    Star,
} from 'lucide-react';

export interface Address {
    id?: number;
    type: 'invoice' | 'delivery' | 'private' | 'other';
    name?: string;
    street?: string;
    street2?: string;
    city?: string;
    postal_code?: string;
    state_id?: number;
    country_id?: number;
    phone?: string;
    email?: string;
    notes?: string;
    is_default: boolean;
}

interface AddressManagerProps {
    addresses: Address[];
    onAdd: (address: Omit<Address, 'id'>) => Promise<void>;
    onUpdate: (id: number, address: Partial<Address>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    countries?: Array<{ id: number; name: string; code: string }>;
    states?: Array<{ id: number; name: string; code: string; country_id: number }>;
    readonly?: boolean;
}

const typeIcons = {
    invoice: FileText,
    delivery: Truck,
    private: Home,
    other: MapPin,
};

const typeLabels = {
    invoice: 'Invoice Address',
    delivery: 'Delivery Address',
    private: 'Private Address',
    other: 'Other Address',
};

const typeColors = {
    invoice: 'bg-blue-500/10 text-blue-700',
    delivery: 'bg-green-500/10 text-green-700',
    private: 'bg-purple-500/10 text-purple-700',
    other: 'bg-gray-500/10 text-gray-700',
};

function AddressCard({ 
    address, 
    onEdit, 
    onDelete,
    countries,
    readonly,
}: { 
    address: Address;
    onEdit: () => void;
    onDelete: () => void;
    countries?: Array<{ id: number; name: string }>;
    readonly?: boolean;
}) {
    const Icon = typeIcons[address.type];
    const country = countries?.find(c => c.id === address.country_id);

    const fullAddress = [
        address.street,
        address.street2,
        [address.city, address.postal_code].filter(Boolean).join(' '),
        country?.name,
    ].filter(Boolean).join(', ');

    return (
        <div className="p-4 border border-border rounded-lg hover:border-primary/20 transition-colors group">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[address.type]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{typeLabels[address.type]}</span>
                            {address.is_default && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <Star className="w-3 h-3" />
                                    Default
                                </Badge>
                            )}
                        </div>
                        {address.name && (
                            <p className="text-sm text-muted-foreground">{address.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{fullAddress || 'No address'}</p>
                        {(address.phone || address.email) && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {[address.phone, address.email].filter(Boolean).join(' | ')}
                            </p>
                        )}
                    </div>
                </div>
                
                {!readonly && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function AddressFormDialog({
    open,
    onOpenChange,
    address,
    onSave,
    countries,
    states,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    address: Address | null;
    onSave: (data: Omit<Address, 'id'>) => void;
    countries?: Array<{ id: number; name: string }>;
    states?: Array<{ id: number; name: string; country_id: number }>;
}) {
    const [formData, setFormData] = useState<Omit<Address, 'id'>>(
        address || {
            type: 'invoice',
            is_default: false,
        }
    );

    React.useEffect(() => {
        if (address) {
            setFormData(address);
        } else {
            setFormData({ type: 'invoice', is_default: false });
        }
    }, [address, open]);

    const filteredStates = states?.filter(s => s.country_id === formData.country_id) || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{address ? 'Edit Address' : 'Add Address'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Address Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v as Address['type'] })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="invoice">Invoice Address</SelectItem>
                                    <SelectItem value="delivery">Delivery Address</SelectItem>
                                    <SelectItem value="private">Private Address</SelectItem>
                                    <SelectItem value="other">Other Address</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Label (optional)</Label>
                            <Input
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Main Office"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Street</Label>
                        <Input
                            value={formData.street || ''}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Street 2</Label>
                        <Input
                            value={formData.street2 || ''}
                            onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                            placeholder="Apartment, suite, etc."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Postal Code</Label>
                            <Input
                                value={formData.postal_code || ''}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Select
                                value={formData.country_id?.toString() || ''}
                                onValueChange={(v) => setFormData({ 
                                    ...formData, 
                                    country_id: v ? parseInt(v) : undefined,
                                    state_id: undefined, // Reset state when country changes
                                })}
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
                        <div className="space-y-2">
                            <Label>State/Province</Label>
                            <Select
                                value={formData.state_id?.toString() || ''}
                                onValueChange={(v) => setFormData({ ...formData, state_id: v ? parseInt(v) : undefined })}
                                disabled={!formData.country_id || filteredStates.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredStates.map((state) => (
                                        <SelectItem key={state.id} value={state.id.toString()}>
                                            {state.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_default">Set as default</Label>
                        <Switch
                            id="is_default"
                            checked={formData.is_default}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {address ? 'Save Changes' : 'Add Address'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function AddressManager({
    addresses,
    onAdd,
    onUpdate,
    onDelete,
    countries,
    states,
    readonly = false,
}: AddressManagerProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const handleAdd = () => {
        setEditingAddress(null);
        setDialogOpen(true);
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setDialogOpen(true);
    };

    const handleSave = async (data: Omit<Address, 'id'>) => {
        if (editingAddress?.id) {
            await onUpdate(editingAddress.id, data);
        } else {
            await onAdd(data);
        }
    };

    const handleDelete = async (address: Address) => {
        if (address.id && confirm('Are you sure you want to delete this address?')) {
            await onDelete(address.id);
        }
    };

    // Group by type
    const groupedAddresses = addresses.reduce((acc, addr) => {
        if (!acc[addr.type]) acc[addr.type] = [];
        acc[addr.type].push(addr);
        return acc;
    }, {} as Record<string, Address[]>);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Addresses</h3>
                {!readonly && (
                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                    </Button>
                )}
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No addresses added yet</p>
                    {!readonly && (
                        <Button variant="link" onClick={handleAdd}>
                            Add your first address
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <AddressCard
                            key={address.id || `${address.type}-${address.street}`}
                            address={address}
                            onEdit={() => handleEdit(address)}
                            onDelete={() => handleDelete(address)}
                            countries={countries}
                            readonly={readonly}
                        />
                    ))}
                </div>
            )}

            <AddressFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                address={editingAddress}
                onSave={handleSave}
                countries={countries}
                states={states}
            />
        </div>
    );
}
