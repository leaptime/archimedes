import React from 'react';
import { useModelFields, ExtensionFieldDef } from '@/hooks/use-extensions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExtensionFieldsProps {
    model: string;
    data: Record<string, any>;
    setData: (data: Record<string, any>) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
    group?: string; // Filter by group
    className?: string;
}

/**
 * Renders custom fields added by extensions for a model
 */
export function ExtensionFields({
    model,
    data,
    setData,
    errors = {},
    disabled = false,
    group,
    className,
}: ExtensionFieldsProps) {
    const { fields, loading } = useModelFields(model);

    if (loading || fields.length === 0) {
        return null;
    }

    // Filter by group if specified
    const filteredFields = group 
        ? fields.filter(f => f.group === group)
        : fields;

    if (filteredFields.length === 0) {
        return null;
    }

    // Extension data is stored in a special field
    const extensionData = data.extension_data || {};

    const updateField = (fieldName: string, value: any) => {
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
                            <ExtensionFieldInput
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

interface ExtensionFieldInputProps {
    field: ExtensionFieldDef;
    value: any;
    onChange: (value: any) => void;
    error?: string;
    disabled?: boolean;
}

function ExtensionFieldInput({ field, value, onChange, error, disabled }: ExtensionFieldInputProps) {
    const renderInput = () => {
        switch (field.type) {
            case 'string':
            case 'text':
                return (
                    <Input
                        id={field.name}
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={field.label}
                    />
                );

            case 'email':
                return (
                    <Input
                        id={field.name}
                        type="email"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={field.label}
                    />
                );

            case 'url':
                return (
                    <Input
                        id={field.name}
                        type="url"
                        value={value || ''}
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
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        disabled={disabled}
                        min={field.validation?.min}
                        max={field.validation?.max}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={field.name}
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case 'datetime':
                return (
                    <Input
                        id={field.name}
                        type="datetime-local"
                        value={value || ''}
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
                        value={value || ''}
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
                        value={value || ''}
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
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );
        }
    };

    // Boolean fields render differently (checkbox with inline label)
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
export function ExtensionFieldsDisplay({
    model,
    data,
    group,
    className,
}: {
    model: string;
    data: Record<string, any>;
    group?: string;
    className?: string;
}) {
    const { fields, loading } = useModelFields(model);

    if (loading || fields.length === 0) {
        return null;
    }

    const filteredFields = group 
        ? fields.filter(f => f.group === group)
        : fields;

    if (filteredFields.length === 0) {
        return null;
    }

    const extensionData = data.extension_data || {};

    return (
        <div className={className}>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFields.map((field) => {
                    const value = extensionData[field.name];
                    if (value === undefined || value === null || value === '') {
                        return null;
                    }

                    return (
                        <div key={field.name}>
                            <dt className="text-sm text-muted-foreground">{field.label}</dt>
                            <dd className="text-sm font-medium">
                                {formatFieldValue(field, value)}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}

function formatFieldValue(field: ExtensionFieldDef, value: any): string {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
        case 'boolean':
            return value ? 'Yes' : 'No';
        case 'select':
            const option = field.options?.find(o => o.value === value);
            return option?.label || value;
        case 'date':
            return new Date(value).toLocaleDateString();
        case 'datetime':
            return new Date(value).toLocaleString();
        default:
            return String(value);
    }
}
