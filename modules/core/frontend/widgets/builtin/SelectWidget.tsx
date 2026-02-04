import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectWidgetProps extends WidgetProps {
    choices?: SelectOption[];
    clearable?: boolean;
}

export function SelectWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    placeholder,
    className,
    options,
    field,
}: SelectWidgetProps) {
    // Get choices from options or field selection
    const choices: SelectOption[] = options?.choices || 
        field.selection?.map(([val, label]) => ({ value: val, label })) || 
        [];

    const selectedOption = choices.find(c => String(c.value) === String(value));

    if (readonly) {
        return (
            <div className="text-sm py-2">
                {selectedOption?.label || <span className="text-muted-foreground">-</span>}
            </div>
        );
    }

    return (
        <Select
            value={value != null ? String(value) : ''}
            onValueChange={(val) => onChange(val === '' ? null : val)}
            disabled={disabled}
        >
            <SelectTrigger 
                id={name}
                className={cn(
                    error && 'border-destructive focus:ring-destructive',
                    className
                )}
            >
                <SelectValue placeholder={placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
                {options?.clearable && (
                    <SelectItem value="">
                        <span className="text-muted-foreground">None</span>
                    </SelectItem>
                )}
                {choices.map((choice) => (
                    <SelectItem key={choice.value} value={String(choice.value)}>
                        {choice.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

registerWidget('select', {
    component: SelectWidget,
    displayName: 'Dropdown',
    supportedTypes: ['selection', 'enum', '*'],
    defaultFor: ['selection', 'enum'],
    isEmpty: (value) => value === null || value === undefined || value === '',
    options: [
        { 
            name: 'choices', 
            type: 'string', 
            label: 'Choices (JSON)',
            help: '[{"value": "a", "label": "Option A"}, ...]'
        },
        { name: 'clearable', type: 'boolean', label: 'Allow Clear', default: false },
    ],
});
