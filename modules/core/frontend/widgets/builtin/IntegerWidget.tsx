import React from 'react';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface IntegerWidgetProps extends WidgetProps {
    min?: number;
    max?: number;
    step?: number;
}

export function IntegerWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: IntegerWidgetProps) {
    const formatValue = (val: number | null | undefined) => {
        if (val === null || val === undefined) return '';
        return val.toLocaleString();
    };

    if (readonly) {
        return (
            <div className="text-sm py-2">
                {value !== null && value !== undefined 
                    ? formatValue(value) 
                    : <span className="text-muted-foreground">-</span>
                }
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(null);
        } else {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                onChange(num);
            }
        }
    };

    return (
        <Input
            id={name}
            type="number"
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder || '0'}
            min={options?.min}
            max={options?.max}
            step={options?.step || 1}
            className={cn(
                'text-right',
                error && 'border-destructive focus-visible:ring-destructive',
                className
            )}
        />
    );
}

registerWidget('integer', {
    component: IntegerWidget,
    displayName: 'Integer',
    supportedTypes: ['integer', 'int', 'bigint', 'smallint'],
    defaultFor: ['integer', 'int', 'bigint', 'smallint'],
    isEmpty: (value) => value === null || value === undefined,
    options: [
        { name: 'min', type: 'number', label: 'Minimum' },
        { name: 'max', type: 'number', label: 'Maximum' },
        { name: 'step', type: 'number', label: 'Step', default: 1 },
    ],
});
