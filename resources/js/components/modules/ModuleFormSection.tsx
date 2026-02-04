import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModuleFormSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
    columns?: 1 | 2 | 3;
    noPadding?: boolean;
}

export function ModuleFormSection({
    title,
    description,
    children,
    className,
    columns = 1,
    noPadding = false,
}: ModuleFormSectionProps) {
    const gridCols = {
        1: '',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
    };

    return (
        <Card className={className}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle className="text-base">{title}</CardTitle>}
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent className={cn(noPadding && 'p-0')}>
                <div className={cn(
                    columns > 1 && 'grid gap-4',
                    gridCols[columns]
                )}>
                    {children}
                </div>
            </CardContent>
        </Card>
    );
}

interface FormRowProps {
    children: ReactNode;
    className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
    return (
        <div className={cn('grid gap-4 md:grid-cols-2', className)}>
            {children}
        </div>
    );
}

interface FormGroupProps {
    children: ReactNode;
    className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {children}
        </div>
    );
}
