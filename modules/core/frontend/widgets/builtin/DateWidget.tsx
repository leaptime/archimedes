import React from 'react';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface DateWidgetProps extends WidgetProps {
    min?: string;
    max?: string;
}

export function DateWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: DateWidgetProps) {
    const formatDate = (val: string | null | undefined) => {
        if (!val) return '';
        try {
            const date = new Date(val);
            return date.toLocaleDateString();
        } catch {
            return val;
        }
    };

    if (readonly) {
        return (
            <div className="text-sm py-2 flex items-center gap-1">
                {value ? (
                    <>
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(value)}
                    </>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
                id={name}
                type="date"
                value={value || ''}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                min={options?.min}
                max={options?.max}
                className={cn(
                    'pl-9',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
        </div>
    );
}

export function DateTimeWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
}: DateWidgetProps) {
    const formatDateTime = (val: string | null | undefined) => {
        if (!val) return '';
        try {
            const date = new Date(val);
            return date.toLocaleString();
        } catch {
            return val;
        }
    };

    if (readonly) {
        return (
            <div className="text-sm py-2 flex items-center gap-1">
                {value ? (
                    <>
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatDateTime(value)}
                    </>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
                id={name}
                type="datetime-local"
                value={value || ''}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                min={options?.min}
                max={options?.max}
                className={cn(
                    'pl-9',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
            />
        </div>
    );
}

registerWidget('date', {
    component: DateWidget,
    displayName: 'Date',
    supportedTypes: ['date'],
    defaultFor: ['date'],
    isEmpty: (value) => !value,
    options: [
        { name: 'min', type: 'string', label: 'Min Date' },
        { name: 'max', type: 'string', label: 'Max Date' },
    ],
});

registerWidget('datetime', {
    component: DateTimeWidget,
    displayName: 'Date & Time',
    supportedTypes: ['datetime', 'timestamp'],
    defaultFor: ['datetime', 'timestamp'],
    isEmpty: (value) => !value,
    options: [
        { name: 'min', type: 'string', label: 'Min Date' },
        { name: 'max', type: 'string', label: 'Max Date' },
    ],
});
