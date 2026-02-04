import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleFiltersProps {
    children: ReactNode;
    onClear?: () => void;
    hasActiveFilters?: boolean;
    className?: string;
}

export function ModuleFilters({
    children,
    onClear,
    hasActiveFilters = false,
    className,
}: ModuleFiltersProps) {
    return (
        <div className={cn('flex flex-wrap items-center gap-3', className)}>
            {children}
            {hasActiveFilters && onClear && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-9 text-muted-foreground"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}

interface FilterGroupProps {
    children: ReactNode;
    className?: string;
}

export function FilterGroup({ children, className }: FilterGroupProps) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            {children}
        </div>
    );
}

interface FilterButtonProps {
    active?: boolean;
    onClick: () => void;
    children: ReactNode;
    count?: number;
}

export function FilterButton({ active, onClick, children, count }: FilterButtonProps) {
    return (
        <Button
            variant={active ? 'default' : 'outline'}
            size="sm"
            onClick={onClick}
            className="h-9"
        >
            {children}
            {count !== undefined && count > 0 && (
                <span className={cn(
                    'ml-1.5 rounded-full px-1.5 text-xs',
                    active ? 'bg-primary-foreground/20' : 'bg-muted'
                )}>
                    {count}
                </span>
            )}
        </Button>
    );
}
