import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MoneyFieldProps {
    label?: string;
    name: string;
    value: number;
    onChange: (value: number) => void;
    currency?: string;
    currencySymbol?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    description?: string;
    min?: number;
    max?: number;
    decimals?: number;
}

export function MoneyField({
    label,
    name,
    value,
    onChange,
    currency = 'USD',
    currencySymbol = '$',
    error,
    required,
    disabled,
    className,
    description,
    min,
    max,
    decimals = 2,
}: MoneyFieldProps) {
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                </span>
                <Input
                    id={name}
                    name={name}
                    type="number"
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    step={Math.pow(10, -decimals)}
                    min={min}
                    max={max}
                    className={cn('pl-7 text-right', error && 'border-destructive')}
                />
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
