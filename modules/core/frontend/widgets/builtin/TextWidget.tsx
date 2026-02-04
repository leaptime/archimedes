import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface TextWidgetProps extends WidgetProps {
    rows?: number;
    maxLength?: number;
}

export function TextWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: TextWidgetProps) {
    const rows = options?.rows || 4;

    if (readonly) {
        return (
            <div className="text-sm py-2 whitespace-pre-wrap">
                {value || <span className="text-muted-foreground">-</span>}
            </div>
        );
    }

    return (
        <Textarea
            id={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            maxLength={options?.maxLength}
            className={cn(
                'resize-y min-h-[80px]',
                error && 'border-destructive focus-visible:ring-destructive',
                className
            )}
        />
    );
}

registerWidget('text', {
    component: TextWidget,
    displayName: 'Multi-line Text',
    supportedTypes: ['text', 'longtext'],
    defaultFor: ['text', 'longtext'],
    isEmpty: (value) => !value || value === '',
    options: [
        { name: 'rows', type: 'number', label: 'Rows', default: 4 },
        { name: 'maxLength', type: 'number', label: 'Max Length' },
    ],
});
