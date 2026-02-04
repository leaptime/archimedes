import React from 'react';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface MonetaryWidgetProps extends WidgetProps {
    currency?: string;
    currencyField?: string;
    hideSymbol?: boolean;
    precision?: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
};

export function MonetaryWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
    field,
}: MonetaryWidgetProps) {
    const currency = options?.currency || 'USD';
    const hideSymbol = options?.hideSymbol || false;
    const precision = options?.precision ?? 2;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    const formatValue = (val: number | null | undefined) => {
        if (val === null || val === undefined) return '';
        return val.toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        });
    };

    if (readonly) {
        return (
            <div className="text-sm py-2 font-mono">
                {value !== null && value !== undefined ? (
                    <>
                        {!hideSymbol && <span className="text-muted-foreground">{symbol}</span>}
                        {' '}{formatValue(value)}
                    </>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(null);
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                onChange(num);
            }
        }
    };

    return (
        <div className="relative">
            {!hideSymbol && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {symbol}
                </span>
            )}
            <Input
                id={name}
                type="number"
                value={value ?? ''}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder || '0.00'}
                step={Math.pow(10, -precision)}
                className={cn(
                    'text-right font-mono',
                    !hideSymbol && 'pl-8',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
        </div>
    );
}

registerWidget('monetary', {
    component: MonetaryWidget,
    displayName: 'Monetary',
    supportedTypes: ['decimal', 'float', 'money'],
    defaultFor: ['decimal', 'money'],
    isEmpty: (value) => value === null || value === undefined,
    options: [
        { name: 'currency', type: 'string', label: 'Currency Code', default: 'USD' },
        { name: 'currency_field', type: 'field', label: 'Currency Field' },
        { name: 'hide_symbol', type: 'boolean', label: 'Hide Symbol', default: false },
        { name: 'precision', type: 'number', label: 'Decimal Places', default: 2 },
    ],
    extractProps: (field, options) => ({
        currency: options?.currency,
        currencyField: options?.currency_field,
        hideSymbol: options?.hide_symbol,
        precision: options?.precision,
    }),
});
