import React from 'react';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface FloatWidgetProps extends WidgetProps {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
}

export function FloatWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: FloatWidgetProps) {
    const precision = options?.precision ?? 2;

    const formatValue = (val: number | null | undefined) => {
        if (val === null || val === undefined) return '';
        return val.toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        });
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
            const num = parseFloat(val);
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
            placeholder={placeholder || '0.00'}
            min={options?.min}
            max={options?.max}
            step={options?.step || Math.pow(10, -precision)}
            className={cn(
                'text-right',
                error && 'border-destructive focus-visible:ring-destructive',
                className
            )}
        />
    );
}

registerWidget('float', {
    component: FloatWidget,
    displayName: 'Decimal',
    supportedTypes: ['float', 'double', 'real'],
    defaultFor: ['float', 'double', 'real'],
    isEmpty: (value) => value === null || value === undefined,
    options: [
        { name: 'min', type: 'number', label: 'Minimum' },
        { name: 'max', type: 'number', label: 'Maximum' },
        { name: 'step', type: 'number', label: 'Step' },
        { name: 'precision', type: 'number', label: 'Decimal Places', default: 2 },
    ],
});
