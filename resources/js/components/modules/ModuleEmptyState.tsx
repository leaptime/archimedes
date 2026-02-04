import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleEmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
    };
    variant?: 'default' | 'search' | 'error';
    className?: string;
}

export function ModuleEmptyState({
    icon,
    title,
    description,
    action,
    variant = 'default',
    className,
}: ModuleEmptyStateProps) {
    const defaultIcons = {
        default: <FileX className="h-12 w-12" />,
        search: <Search className="h-12 w-12" />,
        error: <FileX className="h-12 w-12" />,
    };

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-12 px-4 text-center',
            className
        )}>
            <div className={cn(
                'mb-4',
                variant === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )}>
                {icon || defaultIcons[variant]}
            </div>
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.icon || <Plus className="h-4 w-4 mr-2" />}
                    {action.label}
                </Button>
            )}
        </div>
    );
}
