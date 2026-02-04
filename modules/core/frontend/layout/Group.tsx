import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GroupProps {
    columns?: 1 | 2 | 3 | 4;
    title?: string;
    className?: string;
    children: ReactNode;
}

/**
 * Group - Responsive column layout for form fields
 */
export function Group({ 
    columns = 2, 
    title,
    className, 
    children 
}: GroupProps) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={cn('space-y-4', className)}>
            {title && (
                <h4 className="text-sm font-medium text-foreground">{title}</h4>
            )}
            <div className={cn('grid gap-4', gridCols[columns])}>
                {children}
            </div>
        </div>
    );
}

/**
 * GroupItem - Wrapper for items that span multiple columns
 */
export function GroupItem({ 
    span = 1,
    className,
    children 
}: { 
    span?: 1 | 2 | 3 | 4 | 'full';
    className?: string;
    children: ReactNode;
}) {
    const colSpan = {
        1: '',
        2: 'md:col-span-2',
        3: 'md:col-span-2 lg:col-span-3',
        4: 'md:col-span-2 lg:col-span-4',
        'full': 'col-span-full',
    };

    return (
        <div className={cn(colSpan[span], className)}>
            {children}
        </div>
    );
}

/**
 * Separator between groups
 */
export function GroupSeparator({ className }: { className?: string }) {
    return (
        <div className={cn('border-t border-border my-6', className)} />
    );
}
