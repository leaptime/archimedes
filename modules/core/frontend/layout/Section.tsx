import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
    children: ReactNode;
}

/**
 * Section - Collapsible section with title
 */
export function Section({
    title,
    subtitle,
    icon,
    collapsible = false,
    defaultOpen = true,
    className,
    children,
}: SectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleToggle = () => {
        if (collapsible) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div
                className={cn(
                    'flex items-center gap-2',
                    collapsible && 'cursor-pointer select-none'
                )}
                onClick={handleToggle}
            >
                {collapsible && (
                    <span className="text-muted-foreground">
                        {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </span>
                )}
                {icon && (
                    <span className="text-muted-foreground">{icon}</span>
                )}
                <div>
                    <h4 className="text-sm font-medium text-foreground">{title}</h4>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            </div>
            
            {isOpen && (
                <div className={cn(collapsible && 'pl-6')}>
                    {children}
                </div>
            )}
        </div>
    );
}

/**
 * Card-style section with border
 */
export function SectionCard({
    title,
    subtitle,
    icon,
    actions,
    className,
    children,
}: SectionProps & { actions?: ReactNode }) {
    return (
        <div className={cn(
            'border border-border rounded-lg',
            className
        )}>
            <div className="px-4 py-3 border-b border-border bg-muted/30 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon && (
                        <span className="text-muted-foreground">{icon}</span>
                    )}
                    <div>
                        <h4 className="text-sm font-medium text-foreground">{title}</h4>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">{actions}</div>
                )}
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
