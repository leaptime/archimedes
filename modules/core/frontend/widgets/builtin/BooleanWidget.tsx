import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface BooleanWidgetProps extends WidgetProps {
    label?: string;
}

export function CheckboxWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    className,
    options,
}: BooleanWidgetProps) {
    if (readonly) {
        return (
            <div className="text-sm py-2 flex items-center gap-1">
                {value ? (
                    <Check className="w-4 h-4 text-green-600" />
                ) : (
                    <X className="w-4 h-4 text-muted-foreground" />
                )}
                {options?.label}
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Checkbox
                id={name}
                checked={!!value}
                onCheckedChange={(checked) => onChange(checked)}
                disabled={disabled}
            />
            {options?.label && (
                <label 
                    htmlFor={name} 
                    className="text-sm cursor-pointer"
                >
                    {options.label}
                </label>
            )}
        </div>
    );
}

export function SwitchWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    className,
    options,
}: BooleanWidgetProps) {
    if (readonly) {
        return (
            <div className="text-sm py-2 flex items-center gap-2">
                <div className={cn(
                    'w-2 h-2 rounded-full',
                    value ? 'bg-green-500' : 'bg-muted-foreground'
                )} />
                {value ? 'Yes' : 'No'}
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Switch
                id={name}
                checked={!!value}
                onCheckedChange={(checked) => onChange(checked)}
                disabled={disabled}
            />
            {options?.label && (
                <label 
                    htmlFor={name} 
                    className="text-sm cursor-pointer"
                >
                    {options.label}
                </label>
            )}
        </div>
    );
}

registerWidget('checkbox', {
    component: CheckboxWidget,
    displayName: 'Checkbox',
    supportedTypes: ['boolean', 'bool'],
    defaultFor: ['boolean', 'bool'],
    isEmpty: () => false, // Boolean is never "empty"
    options: [
        { name: 'label', type: 'string', label: 'Label' },
    ],
});

registerWidget('switch', {
    component: SwitchWidget,
    displayName: 'Switch',
    supportedTypes: ['boolean', 'bool'],
    isEmpty: () => false,
    options: [
        { name: 'label', type: 'string', label: 'Label' },
    ],
});

registerWidget('boolean', {
    component: CheckboxWidget,
    displayName: 'Boolean',
    supportedTypes: ['boolean', 'bool'],
    isEmpty: () => false,
});
