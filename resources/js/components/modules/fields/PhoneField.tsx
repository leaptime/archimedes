import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneFieldProps {
    label?: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    description?: string;
}

export function PhoneField({
    label,
    name,
    value,
    onChange,
    placeholder = '+1 (555) 000-0000',
    error,
    required,
    disabled,
    className,
    description,
}: PhoneFieldProps) {
    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id={name}
                    name={name}
                    type="tel"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="tel"
                    className={cn('pl-9', error && 'border-destructive')}
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
