import React from 'react';
import { useModelFields } from './provider';
import { useFormContext } from './form-context';
import { ExtensionFieldDef, FieldType } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExtensionFieldsProps {
    /** Model to get fields for (e.g., "Contact") */
    model: string;
    /** Form data (optional if inside FormProvider) */
    data?: Record<string, unknown>;
    /** Data setter (optional if inside FormProvider) */
    setData?: (data: Record<string, unknown>) => void;
    /** Validation errors */
    errors?: Record<string, string>;
    /** Disabled state */
    disabled?: boolean;
    /** Filter by field group */
    group?: string;
    /** Container class name */
    className?: string;
}

/**
 * Extension Fields Component
 * 
 * Renders custom fields added by extensions for a model.
 * Can be used standalone or inside a FormProvider.
 * 
 * @example
 * // Standalone usage
 * <ExtensionFields
 *   model="Contact"
 *   data={formData}
 *   setData={setFormData}
 *   errors={errors}
 * />
 * 
 * @example
 * // Inside FormProvider (auto-inherits context)
 * <FormProvider data={data} onDataChange={setData}>
 *   <ExtensionFields model="Contact" />
 * </FormProvider>
 */
export function ExtensionFields({
    model,
    data: propData,
    setData: propSetData,
    errors: propErrors,
    disabled: propDisabled,
    group,
    className,
}: ExtensionFieldsProps) {
    const { fields, loading, hasFields } = useModelFields(model);
    const formContext = useFormContext();

    // Use props or form context
    const data = (propData ?? formContext?.data ?? {}) as Record<string, unknown>;
    const setData = propSetData ?? formContext?.setData;
    const errors = propErrors ?? formContext?.errors ?? {};
    const disabled = propDisabled ?? formContext?.disabled ?? false;

    if (loading || !hasFields) {
        return null;
    }

    // Filter by group if specified
    const filteredFields = group
        ? fields.filter(f => f.group === group)
        : fields;

    if (filteredFields.length === 0) {
        return null;
    }

    // Extension fields are stored in extension_data
    const extensionData = (data.extension_data as Record<string, unknown>) || {};

    const updateField = (fieldName: string, value: unknown) => {
        if (!setData) return;
        
        setData({
            ...data,
            extension_data: {
                ...extensionData,
                [fieldName]: value,
            },
        });
    };

    // Group fields by their group property
    const groupedFields = filteredFields.reduce((acc, field) => {
        const key = field.group || 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(field);
        return acc;
    }, {} as Record<string, ExtensionFieldDef[]>);

    return (
        <div className={className}>
            {Object.entries(groupedFields).map(([groupName, groupFields]) => (
                <div key={groupName} className="space-y-4">
                    {groupName !== 'other' && (
                        <h4 className="text-sm font-medium text-muted-foreground capitalize">
                            {groupName} Fields
                        </h4>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupFields.map((field) => (
                            <FieldInput
                                key={field.name}
                                field={field}
                                value={extensionData[field.name]}
                                onChange={(value) => updateField(field.name, value)}
                                error={errors[`extension_data.${field.name}`]}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface FieldInputProps {
    field: ExtensionFieldDef;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

function FieldInput({ field, value, onChange, error, disabled }: FieldInputProps) {
    const renderInput = () => {
        switch (field.type) {
            case 'string':
            case 'text':
                return (
                    <Input
                        id={field.name}
                        type="text"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={field.placeholder || field.label}
                    />
                );

            case 'email':
                return (
                    <Input
                        id={field.name}
                        type="email"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={field.placeholder || field.label}
                    />
                );

            case 'url':
                return (
                    <Input
                        id={field.name}
                        type="url"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder="https://..."
                    />
                );

            case 'integer':
            case 'number':
                return (
                    <Input
                        id={field.name}
                        type="number"
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        disabled={disabled}
                        min={field.validation?.min as number}
                        max={field.validation?.max as number}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={field.name}
                        type="date"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case 'datetime':
                return (
                    <Input
                        id={field.name}
                        type="datetime-local"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case 'boolean':
                return (
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id={field.name}
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(checked)}
                            disabled={disabled}
                        />
                        <Label htmlFor={field.name} className="text-sm font-normal">
                            {field.label}
                        </Label>
                    </div>
                );

            case 'select':
                return (
                    <Select
                        value={(value as string) || ''}
                        onValueChange={onChange}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.filter(o => o.value).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'textarea':
                return (
                    <Textarea
                        id={field.name}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        rows={3}
                    />
                );

            default:
                return (
                    <Input
                        id={field.name}
                        type="text"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );
        }
    };

    // Boolean fields have inline label
    if (field.type === 'boolean') {
        return (
            <div className="space-y-2">
                {renderInput()}
                {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
                {field.helpText && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{field.helpText}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </Label>
            {renderInput()}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

/**
 * Display extension field values (read-only)
 */
interface ExtensionFieldsDisplayProps {
    model: string;
    data: Record<string, unknown>;
    group?: string;
    className?: string;
}

export function ExtensionFieldsDisplay({
    model,
    data,
    group,
    className,
}: ExtensionFieldsDisplayProps) {
    const { fields, loading, hasFields } = useModelFields(model);

    if (loading || !hasFields) {
        return null;
    }

    const filteredFields = group
        ? fields.filter(f => f.group === group)
        : fields;

    if (filteredFields.length === 0) {
        return null;
    }

    const extensionData = (data.extension_data as Record<string, unknown>) || {};

    // Only show fields that have values
    const fieldsWithValues = filteredFields.filter(f => {
        const value = extensionData[f.name];
        return value !== undefined && value !== null && value !== '';
    });

    if (fieldsWithValues.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldsWithValues.map((field) => (
                    <div key={field.name}>
                        <dt className="text-sm text-muted-foreground">{field.label}</dt>
                        <dd className="text-sm font-medium">
                            {formatFieldValue(field, extensionData[field.name])}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function formatFieldValue(field: ExtensionFieldDef, value: unknown): string {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
        case 'boolean':
            return value ? 'Yes' : 'No';
        case 'select':
            const option = field.options?.find(o => o.value === value);
            return option?.label || String(value);
        case 'date':
            return new Date(value as string).toLocaleDateString();
        case 'datetime':
            return new Date(value as string).toLocaleString();
        default:
            return String(value);
    }
}
