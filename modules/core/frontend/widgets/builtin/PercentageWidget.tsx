import React from 'react';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface PercentageWidgetProps extends WidgetProps {
    precision?: number;
    factor?: number; // 100 for percentage stored as decimal (0.5 -> 50%)
}

export function PercentageWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: PercentageWidgetProps) {
    const precision = options?.precision ?? 1;
    const factor = options?.factor ?? 100;

    // Convert stored value to display value
    const displayValue = value != null ? value * factor : null;

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
                {displayValue !== null ? (
                    <>{formatValue(displayValue)}%</>
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
                // Convert display value back to stored value
                onChange(num / factor);
            }
        }
    };

    return (
        <div className="relative">
            <Input
                id={name}
                type="number"
                value={displayValue ?? ''}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder || '0'}
                step={Math.pow(10, -precision)}
                min={0}
                max={100}
                className={cn(
                    'text-right pr-8',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                %
            </span>
        </div>
    );
}

registerWidget('percentage', {
    component: PercentageWidget,
    displayName: 'Percentage',
    supportedTypes: ['float', 'decimal'],
    isEmpty: (value) => value === null || value === undefined,
    options: [
        { name: 'precision', type: 'number', label: 'Decimal Places', default: 1 },
        { name: 'factor', type: 'number', label: 'Factor', default: 100 },
    ],
});
