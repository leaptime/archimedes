import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WidgetProps } from '../types';
import { registerWidget } from '../registry';
import { cn } from '@/lib/utils';

interface RadioOption {
    value: string | number;
    label: string;
    description?: string;
}

interface RadioWidgetProps extends WidgetProps {
    choices?: RadioOption[];
    orientation?: 'horizontal' | 'vertical';
}

export function RadioWidget({
    name,
    value,
    onChange,
    readonly,
    disabled,
    error,
    className,
    options,
    field,
}: RadioWidgetProps) {
    const choices: RadioOption[] = options?.choices || 
        field.selection?.map(([val, label]) => ({ value: val, label })) || 
        [];
    const orientation = options?.orientation || 'vertical';

    const selectedOption = choices.find(c => String(c.value) === String(value));

    if (readonly) {
        return (
            <div className="text-sm py-2">
                {selectedOption?.label || <span className="text-muted-foreground">-</span>}
            </div>
        );
    }

    return (
        <RadioGroup
            value={value != null ? String(value) : ''}
            onValueChange={(val) => onChange(val)}
            disabled={disabled}
            className={cn(
                orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2',
                className
            )}
        >
            {choices.map((choice) => (
                <div key={choice.value} className="flex items-start gap-2">
                    <RadioGroupItem 
                        value={String(choice.value)} 
                        id={`${name}-${choice.value}`}
                        className="mt-0.5"
                    />
                    <div className="flex flex-col">
                        <Label 
                            htmlFor={`${name}-${choice.value}`}
                            className="cursor-pointer font-normal"
                        >
                            {choice.label}
                        </Label>
                        {choice.description && (
                            <span className="text-xs text-muted-foreground">
                                {choice.description}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </RadioGroup>
    );
}

registerWidget('radio', {
    component: RadioWidget,
    displayName: 'Radio Buttons',
    supportedTypes: ['selection', 'enum', '*'],
    isEmpty: (value) => value === null || value === undefined || value === '',
    options: [
        { 
            name: 'choices', 
            type: 'string', 
            label: 'Choices (JSON)',
            help: '[{"value": "a", "label": "Option A"}, ...]'
        },
        { 
            name: 'orientation', 
            type: 'select', 
            label: 'Orientation',
            choices: [
                { value: 'vertical', label: 'Vertical' },
                { value: 'horizontal', label: 'Horizontal' },
            ],
            default: 'vertical'
        },
    ],
});
