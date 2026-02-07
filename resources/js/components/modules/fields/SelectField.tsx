import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectFieldProps {
    label?: string;
    name: string;
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    options: Option[];
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    allowClear?: boolean;
    clearLabel?: string;
    description?: string;
}

export function SelectField({
    label,
    name,
    value,
    onChange,
    options,
    placeholder = 'Select...',
    error,
    required,
    disabled,
    className,
    allowClear = true,
    clearLabel = 'Any',
    description,
}: SelectFieldProps) {
    const handleChange = (newValue: string) => {
        if (newValue === '__clear__') {
            onChange(undefined);
        } else {
            onChange(newValue);
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}
            <Select
                value={value || (allowClear ? '__clear__' : undefined)}
                onValueChange={handleChange}
                disabled={disabled}
            >
                <SelectTrigger
                    id={name}
                    className={cn(error && 'border-destructive')}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {allowClear && (
                        <SelectItem value="__clear__">{clearLabel}</SelectItem>
                    )}
                    {options.filter(o => o.value).map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {description && !error && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}
