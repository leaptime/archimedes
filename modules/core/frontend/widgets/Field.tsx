import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSlotContext } from '../slots/SlotContext';
import { useExpression } from '../hooks/useExpression';
import { widgetRegistry } from './registry';
import { FieldComponentProps } from './types';
import { Label } from '@/components/ui/label';

/**
 * Field component - Resolves widget and renders field with label
 */
export function Field({
    name,
    widget,
    label,
    required: requiredExpr,
    readonly: readonlyExpr,
    invisible: invisibleExpr,
    placeholder,
    options = {},
    className,
    onChange: onChangeProp,
    value: valueProp,
    error: errorProp,
}: FieldComponentProps) {
    const { record, setRecord, errors, readonly: formReadonly } = useSlotContext();

    // Get value from context or prop
    const value = valueProp !== undefined ? valueProp : record[name];
    const error = errorProp !== undefined ? errorProp : errors[name];

    // Create expression context
    const exprContext = useMemo(() => ({ record }), [record]);

    // Evaluate dynamic expressions
    const isRequired = useExpression(requiredExpr, exprContext);
    const isReadonly = useExpression(readonlyExpr, exprContext) || formReadonly;
    const isInvisible = useExpression(invisibleExpr, exprContext);

    // Get field info (could come from model schema in future)
    const fieldInfo = useMemo(() => ({
        name,
        type: 'string', // Default type, would come from model
        label,
        required: isRequired,
        readonly: isReadonly,
        options,
        widget,
    }), [name, label, isRequired, isReadonly, options, widget]);

    // Resolve widget
    const widgetDef = useMemo(
        () => widgetRegistry.resolve(widget, fieldInfo.type),
        [widget, fieldInfo.type]
    );

    // Handle value change
    const handleChange = (newValue: any) => {
        if (onChangeProp) {
            onChangeProp(newValue);
        } else {
            setRecord({ [name]: newValue });
        }
    };

    // Don't render if invisible
    if (isInvisible) {
        return null;
    }

    // Fallback if no widget found
    if (!widgetDef) {
        console.warn(`No widget found for field "${name}"`);
        return (
            <div className={cn('space-y-1', className)}>
                <Label>{label || name}</Label>
                <div className="text-muted-foreground text-sm">
                    Widget not found: {widget || fieldInfo.type}
                </div>
            </div>
        );
    }

    const Widget = widgetDef.component;
    const extractedProps = widgetDef.extractProps?.(fieldInfo, options) || {};

    return (
        <div className={cn('space-y-1', className)}>
            {label !== false && (
                <FieldLabel 
                    label={label || name} 
                    required={isRequired} 
                    htmlFor={name}
                />
            )}
            <Widget
                name={name}
                value={value}
                onChange={handleChange}
                field={fieldInfo}
                readonly={isReadonly}
                required={isRequired}
                disabled={isReadonly}
                error={error}
                placeholder={placeholder}
                options={options}
                {...extractedProps}
            />
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}

/**
 * Field label with required indicator
 */
export function FieldLabel({
    label,
    required,
    htmlFor,
    className,
}: {
    label: string;
    required?: boolean;
    htmlFor?: string;
    className?: string;
}) {
    return (
        <Label 
            htmlFor={htmlFor}
            className={cn('text-sm font-medium', className)}
        >
            {label}
            {required && (
                <span className="text-destructive ml-0.5">*</span>
            )}
        </Label>
    );
}

/**
 * Readonly field display
 */
export function FieldValue({
    value,
    placeholder = '-',
    className,
}: {
    value: any;
    placeholder?: string;
    className?: string;
}) {
    const displayValue = value === null || value === undefined || value === '' 
        ? placeholder 
        : String(value);
    
    return (
        <span className={cn('text-foreground', className)}>
            {displayValue}
        </span>
    );
}
