import React from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

export function PhoneWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
}: WidgetProps) {
    if (readonly) {
        return value ? (
            <a 
                href={`tel:${value}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
            >
                <Phone className="w-3 h-3" />
                {value}
            </a>
        ) : (
            <span className="text-muted-foreground text-sm">-</span>
        );
    }

    return (
        <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                id={name}
                type="tel"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder || '+1 234 567 8900'}
                className={cn(
                    'pl-9',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
        </div>
    );
}

registerWidget('phone', {
    component: PhoneWidget,
    displayName: 'Phone',
    supportedTypes: ['string', 'char'],
    isEmpty: (value) => !value || value === '',
});
