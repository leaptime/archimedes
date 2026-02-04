import React from 'react';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

export function EmailWidget({
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
                href={`mailto:${value}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
            >
                <Mail className="w-3 h-3" />
                {value}
            </a>
        ) : (
            <span className="text-muted-foreground text-sm">-</span>
        );
    }

    return (
        <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                id={name}
                type="email"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder || 'email@example.com'}
                className={cn(
                    'pl-9',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
        </div>
    );
}

registerWidget('email', {
    component: EmailWidget,
    displayName: 'Email',
    supportedTypes: ['string', 'char'],
    isEmpty: (value) => !value || value === '',
    validate: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Invalid email address';
    },
});
