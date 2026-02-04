import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SlotProvider } from '../slots/SlotContext';

interface FormSheetProps {
    viewId: string;
    model: string;
    record: Record<string, any>;
    onRecordChange: (data: Record<string, any>) => void;
    errors?: Record<string, string>;
    onErrorsChange?: (errors: Record<string, string>) => void;
    readonly?: boolean;
    className?: string;
    children: ReactNode;
}

/**
 * FormSheet - Main container for form views
 * Provides context for slots and field components
 */
export function FormSheet({
    viewId,
    model,
    record,
    onRecordChange,
    errors = {},
    onErrorsChange,
    readonly = false,
    className,
    children,
}: FormSheetProps) {
    return (
        <SlotProvider
            viewId={viewId}
            record={record}
            onRecordChange={onRecordChange}
            errors={errors}
            onErrorsChange={onErrorsChange}
            readonly={readonly}
        >
            <div 
                className={cn(
                    'bg-card rounded-xl border border-border',
                    className
                )}
                data-model={model}
                data-view={viewId}
            >
                {children}
            </div>
        </SlotProvider>
    );
}

/**
 * Sheet section with padding
 */
export function SheetContent({ 
    className, 
    children 
}: { 
    className?: string; 
    children: ReactNode 
}) {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    );
}

/**
 * Sheet header area
 */
export function SheetHeader({ 
    className, 
    children 
}: { 
    className?: string; 
    children: ReactNode 
}) {
    return (
        <div className={cn('px-6 py-4 border-b border-border', className)}>
            {children}
        </div>
    );
}

/**
 * Sheet footer area
 */
export function SheetFooter({ 
    className, 
    children 
}: { 
    className?: string; 
    children: ReactNode 
}) {
    return (
        <div className={cn(
            'px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl',
            'flex items-center justify-end gap-2',
            className
        )}>
            {children}
        </div>
    );
}
