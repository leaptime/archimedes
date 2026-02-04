import React from 'react';
import { Badge } from '@/components/ui/badge';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface BadgeOption {
    value: string | number;
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
    color?: string;
}

interface BadgeWidgetProps extends WidgetProps {
    choices?: BadgeOption[];
}

const variantStyles: Record<string, string> = {
    default: '',
    secondary: '',
    destructive: '',
    outline: '',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export function BadgeWidget({
    name,
    value,
    readonly = true, // Badge is typically readonly
    className,
    options,
    field,
}: BadgeWidgetProps) {
    // Get choices from options or field selection
    const choices: BadgeOption[] = options?.choices || 
        field.selection?.map(([val, label]) => ({ value: val, label })) || 
        [];

    const selectedOption = choices.find(c => String(c.value) === String(value));

    if (!selectedOption) {
        return <span className="text-muted-foreground text-sm">-</span>;
    }

    const variant = selectedOption.variant || 'secondary';
    const customStyle = selectedOption.color 
        ? { backgroundColor: selectedOption.color, color: '#fff' }
        : undefined;

    return (
        <Badge 
            variant={variant === 'success' || variant === 'warning' ? 'outline' : variant}
            className={cn(
                variant === 'success' && variantStyles.success,
                variant === 'warning' && variantStyles.warning,
                className
            )}
            style={customStyle}
        >
            {selectedOption.label}
        </Badge>
    );
}

registerWidget('badge', {
    component: BadgeWidget,
    displayName: 'Badge',
    supportedTypes: ['selection', 'enum', 'string'],
    isEmpty: (value) => value === null || value === undefined || value === '',
    options: [
        { 
            name: 'choices', 
            type: 'string', 
            label: 'Choices (JSON)',
            help: '[{"value": "active", "label": "Active", "variant": "success"}, ...]'
        },
    ],
});

// Statusbar widget for workflow states
interface StatusbarWidgetProps extends WidgetProps {
    choices?: BadgeOption[];
}

export function StatusbarWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    className,
    options,
    field,
}: StatusbarWidgetProps) {
    const choices: BadgeOption[] = options?.choices || 
        field.selection?.map(([val, label]) => ({ value: val, label })) || 
        [];

    const currentIndex = choices.findIndex(c => String(c.value) === String(value));

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {choices.map((choice, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = String(choice.value) === String(value);
                const isClickable = !readonly && !disabled && index === currentIndex + 1;

                return (
                    <button
                        key={choice.value}
                        type="button"
                        onClick={() => isClickable && onChange(choice.value)}
                        disabled={!isClickable}
                        className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                            isActive
                                ? isCurrent
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground',
                            isClickable && 'cursor-pointer hover:bg-primary/30',
                            !isClickable && 'cursor-default'
                        )}
                    >
                        {choice.label}
                    </button>
                );
            })}
        </div>
    );
}

registerWidget('statusbar', {
    component: StatusbarWidget,
    displayName: 'Status Bar',
    supportedTypes: ['selection', 'enum', 'string'],
    isEmpty: (value) => value === null || value === undefined || value === '',
    options: [
        { 
            name: 'choices', 
            type: 'string', 
            label: 'Choices (JSON)',
            help: '[{"value": "draft", "label": "Draft"}, {"value": "confirmed", "label": "Confirmed"}, ...]'
        },
    ],
});
