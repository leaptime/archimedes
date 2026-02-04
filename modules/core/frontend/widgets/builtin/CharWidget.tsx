import React from 'react';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

export function CharWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: WidgetProps & { maxLength?: number }) {
    if (readonly) {
        return (
            <div className="text-sm py-2">
                {value || <span className="text-muted-foreground">-</span>}
            </div>
        );
    }

    return (
        <Input
            id={name}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={options?.maxLength}
            className={cn(
                error && 'border-destructive focus-visible:ring-destructive',
                className
            )}
        />
    );
}

registerWidget('char', {
    component: CharWidget,
    displayName: 'Text',
    supportedTypes: ['string', 'char', 'varchar'],
    defaultFor: ['string', 'char', 'varchar'],
    isEmpty: (value) => !value || value === '',
    options: [
        { name: 'maxLength', type: 'number', label: 'Max Length' },
    ],
});
