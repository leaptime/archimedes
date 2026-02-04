import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SwitchFieldProps {
    label: string;
    name: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
    disabled?: boolean;
    className?: string;
}

export function SwitchField({
    label,
    name,
    checked,
    onChange,
    description,
    disabled,
    className,
}: SwitchFieldProps) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            <div className="space-y-0.5">
                <Label htmlFor={name} className="cursor-pointer">
                    {label}
                </Label>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <Switch
                id={name}
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}
