import { ReactNode, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleFormProps {
    children: ReactNode;
    onSubmit: (e: FormEvent) => void;
    loading?: boolean;
    className?: string;
    id?: string;
}

export function ModuleForm({
    children,
    onSubmit,
    loading = false,
    className,
    id,
}: ModuleFormProps) {
    return (
        <form
            id={id}
            onSubmit={onSubmit}
            className={cn('space-y-6', className)}
        >
            {children}
        </form>
    );
}

interface ModuleFormActionsProps {
    onCancel?: () => void;
    loading?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    className?: string;
}

export function ModuleFormActions({
    onCancel,
    loading = false,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    className,
}: ModuleFormActionsProps) {
    return (
        <div className={cn('flex items-center justify-end gap-3', className)}>
            {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                    {cancelLabel}
                </Button>
            )}
            <Button type="submit" disabled={loading}>
                {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Save className="h-4 w-4 mr-2" />
                )}
                {submitLabel}
            </Button>
        </div>
    );
}
