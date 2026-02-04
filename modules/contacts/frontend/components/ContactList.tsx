import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Star,
    Tag,
} from 'lucide-react';

export interface ContactListItem {
    id: number;
    name: string;
    display_name?: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    company: string | null;
    job_title: string | null;
    is_company: boolean;
    is_customer: boolean;
    is_vendor: boolean;
    city: string | null;
    country?: { name: string; code: string } | null;
    industry?: { name: string } | null;
    categories?: Array<{ id: number; name: string; color: string }>;
    // Extension fields
    credit_limit?: number;
    total_invoiced?: number;
    outstanding_balance?: number;
    invoice_count?: number;
}

interface ContactListProps {
    contacts: ContactListItem[];
    onView?: (contact: ContactListItem) => void;
    onEdit?: (contact: ContactListItem) => void;
    onDelete?: (contact: ContactListItem) => void;
    variant?: 'grid' | 'list';
}

function ContactCard({ 
    contact, 
    onView, 
    onEdit, 
    onDelete 
}: { 
    contact: ContactListItem;
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    return (
        <div className="p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        contact.is_company ? 'bg-blue-500/10' : 'bg-green-500/10'
                    }`}>
                        {contact.is_company ? (
                            <Building2 className="w-6 h-6 text-blue-600" />
                        ) : (
                            <User className="w-6 h-6 text-green-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">
                            {contact.display_name || contact.name}
                        </h3>
                        {contact.company && !contact.is_company && (
                            <p className="text-sm text-muted-foreground">{contact.company}</p>
                        )}
                        {contact.job_title && !contact.is_company && (
                            <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                        )}
                        {contact.industry && contact.is_company && (
                            <p className="text-xs text-muted-foreground">{contact.industry.name}</p>
                        )}
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {onView && (
                            <DropdownMenuItem onClick={onView}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                            </DropdownMenuItem>
                        )}
                        {onEdit && (
                            <DropdownMenuItem onClick={onEdit}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
                {contact.is_customer && (
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                        Customer
                    </Badge>
                )}
                {contact.is_vendor && (
                    <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700">
                        Vendor
                    </Badge>
                )}
                {contact.categories?.map(cat => (
                    <Badge 
                        key={cat.id} 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: cat.color, color: cat.color }}
                    >
                        {cat.name}
                    </Badge>
                ))}
            </div>

            {/* Contact Info */}
            <div className="mt-4 space-y-1.5">
                {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${contact.email}`} className="hover:text-foreground truncate">
                            {contact.email}
                        </a>
                    </div>
                )}
                {(contact.phone || contact.mobile) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${contact.phone || contact.mobile}`} className="hover:text-foreground">
                            {contact.phone || contact.mobile}
                        </a>
                    </div>
                )}
                {(contact.city || contact.country) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                            {[contact.city, contact.country?.name].filter(Boolean).join(', ')}
                        </span>
                    </div>
                )}
            </div>

            {/* Extension: Invoicing info */}
            {(contact.invoice_count !== undefined || contact.outstanding_balance !== undefined) && (
                <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                        {contact.invoice_count !== undefined && (
                            <span className="text-muted-foreground">
                                {contact.invoice_count} invoice{contact.invoice_count !== 1 ? 's' : ''}
                            </span>
                        )}
                        {contact.outstanding_balance !== undefined && contact.outstanding_balance > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                {contact.outstanding_balance.toLocaleString()} due
                            </Badge>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ContactRow({ 
    contact, 
    onView, 
    onEdit, 
    onDelete 
}: { 
    contact: ContactListItem;
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    return (
        <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                contact.is_company ? 'bg-blue-500/10' : 'bg-green-500/10'
            }`}>
                {contact.is_company ? (
                    <Building2 className="w-5 h-5 text-blue-600" />
                ) : (
                    <User className="w-5 h-5 text-green-600" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                        {contact.display_name || contact.name}
                    </span>
                    {contact.is_customer && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                            Customer
                        </Badge>
                    )}
                    {contact.is_vendor && (
                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700">
                            Vendor
                        </Badge>
                    )}
                </div>
                {(contact.company || contact.job_title) && !contact.is_company && (
                    <p className="text-sm text-muted-foreground truncate">
                        {[contact.job_title, contact.company].filter(Boolean).join(' at ')}
                    </p>
                )}
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                {contact.email && (
                    <a href={`mailto:${contact.email}`} className="hover:text-foreground truncate max-w-[200px]">
                        {contact.email}
                    </a>
                )}
                {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="hover:text-foreground">
                        {contact.phone}
                    </a>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onView && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
                        <Eye className="w-4 h-4" />
                    </Button>
                )}
                {onEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                        <Edit className="w-4 h-4" />
                    </Button>
                )}
                {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export function ContactList({ 
    contacts, 
    onView, 
    onEdit, 
    onDelete,
    variant = 'grid' 
}: ContactListProps) {
    if (variant === 'list') {
        return (
            <div className="space-y-1">
                {contacts.map((contact) => (
                    <ContactRow
                        key={contact.id}
                        contact={contact}
                        onView={onView ? () => onView(contact) : undefined}
                        onEdit={onEdit ? () => onEdit(contact) : undefined}
                        onDelete={onDelete ? () => onDelete(contact) : undefined}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
                <ContactCard
                    key={contact.id}
                    contact={contact}
                    onView={onView ? () => onView(contact) : undefined}
                    onEdit={onEdit ? () => onEdit(contact) : undefined}
                    onDelete={onDelete ? () => onDelete(contact) : undefined}
                />
            ))}
        </div>
    );
}
