import React, { useEffect, useState } from 'react';
import { registerExtension } from '@modules/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DollarSign, CreditCard, FileText, Building2 } from 'lucide-react';

interface PaymentTerm {
  id: number;
  name: string;
  days: number;
}

interface ContactFormExtensionProps {
  data: Record<string, any>;
  setData: (data: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

function InvoicingFieldsExtension({ data, setData, errors = {}, disabled = false }: ContactFormExtensionProps) {
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch payment terms
    fetch('/api/payment-terms')
      .then(res => res.json())
      .then(result => {
        setPaymentTerms(result.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currencies = [
    { code: 'EUR', name: 'Euro' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CHF', name: 'Swiss Franc' },
  ];

  return (
    <div className="space-y-6">
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4" />
          Invoicing Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Credit Limit */}
          <div className="space-y-2">
            <Label htmlFor="credit_limit" className="flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              Credit Limit
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                min="0"
                className="pl-9"
                value={data.credit_limit || ''}
                onChange={(e) => setData({ ...data, credit_limit: e.target.value })}
                disabled={disabled}
                placeholder="0.00"
              />
            </div>
            {errors.credit_limit && (
              <p className="text-sm text-destructive">{errors.credit_limit}</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={data.currency || 'EUR'}
              onValueChange={(value) => setData({ ...data, currency: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label htmlFor="payment_term_id">Payment Terms</Label>
            <Select
              value={data.payment_term_id?.toString() || ''}
              onValueChange={(value) => setData({ ...data, payment_term_id: value ? parseInt(value) : null })}
              disabled={disabled || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific terms</SelectItem>
                {paymentTerms.map((term) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    {term.name} ({term.days} days)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tax ID */}
          <div className="space-y-2">
            <Label htmlFor="tax_id" className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              Tax ID / VAT Number
            </Label>
            <Input
              id="tax_id"
              type="text"
              value={data.tax_id || ''}
              onChange={(e) => setData({ ...data, tax_id: e.target.value })}
              disabled={disabled}
              placeholder="e.g., IT12345678901"
            />
            {errors.tax_id && (
              <p className="text-sm text-destructive">{errors.tax_id}</p>
            )}
          </div>

          {/* Billing Email */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billing_email">Billing Email</Label>
            <Input
              id="billing_email"
              type="email"
              value={data.billing_email || ''}
              onChange={(e) => setData({ ...data, billing_email: e.target.value })}
              disabled={disabled}
              placeholder="billing@company.com"
            />
            {errors.billing_email && (
              <p className="text-sm text-destructive">{errors.billing_email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              If different from the main email address
            </p>
          </div>

          {/* Billing Address */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              value={data.billing_address || ''}
              onChange={(e) => setData({ ...data, billing_address: e.target.value })}
              disabled={disabled}
              placeholder="Enter billing address if different from main address"
              rows={3}
            />
            {errors.billing_address && (
              <p className="text-sm text-destructive">{errors.billing_address}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Register the extension
registerExtension('contacts.form.after-address', InvoicingFieldsExtension, {
  priority: 100,
  module: 'invoicing',
});

export default InvoicingFieldsExtension;
