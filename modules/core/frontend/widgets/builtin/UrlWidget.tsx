import React from 'react';
import { Input } from '@/components/ui/input';
import { ExternalLink, Globe } from 'lucide-react';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

export function UrlWidget({
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
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
            >
                <ExternalLink className="w-3 h-3" />
                {value}
            </a>
        ) : (
            <span className="text-muted-foreground text-sm">-</span>
        );
    }

    return (
        <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                id={name}
                type="url"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder || 'https://example.com'}
                className={cn(
                    'pl-9',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
        </div>
    );
}

registerWidget('url', {
    component: UrlWidget,
    displayName: 'URL',
    supportedTypes: ['string', 'char'],
    isEmpty: (value) => !value || value === '',
    validate: (value) => {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return 'Invalid URL';
        }
    },
});
