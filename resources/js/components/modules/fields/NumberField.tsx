import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NumberFieldProps {
    label?: string;
    name: string;
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    prefix?: string;
}

export function NumberField({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    required,
    disabled,
    className,
    description,
    min,
    max,
    step = 1,
    suffix,
    prefix,
}: NumberFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value) || 0;
        if (min !== undefined && newValue < min) return;
        if (max !== undefined && newValue > max) return;
        onChange(newValue);
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {prefix}
                    </span>
                )}
                <Input
                    id={name}
                    name={name}
                    type="number"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    step={step}
                    min={min}
                    max={max}
                    className={cn(
                        prefix && 'pl-7',
                        suffix && 'pr-10',
                        error && 'border-destructive'
                    )}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </div>
            {description && !error && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}
