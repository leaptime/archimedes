import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Action } from './ModuleList';

interface ModuleCardProps<T> {
    item: T;
    title: ReactNode;
    subtitle?: ReactNode;
    avatar?: ReactNode;
    badges?: ReactNode;
    content?: ReactNode;
    footer?: ReactNode;
    actions?: Action<T>[];
    onClick?: () => void;
    selected?: boolean;
    className?: string;
}

export function ModuleCard<T>({
    item,
    title,
    subtitle,
    avatar,
    badges,
    content,
    footer,
    actions,
    onClick,
    selected,
    className,
}: ModuleCardProps<T>) {
    return (
        <Card
            className={cn(
                'relative transition-colors',
                onClick && 'cursor-pointer hover:bg-muted/50',
                selected && 'ring-2 ring-primary',
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {avatar && (
                            <div className="flex-shrink-0">
                                {avatar}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{title}</div>
                            {subtitle && (
                                <div className="text-sm text-muted-foreground truncate">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </div>
                    {actions && actions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {actions.map((action, i) => {
                                    if (action.hidden?.(item)) return null;
                                    return (
                                        <div key={i}>
                                            {action.separator && i > 0 && (
                                                <DropdownMenuSeparator />
                                            )}
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    action.onClick(item);
                                                }}
                                                className={cn(
                                                    action.variant === 'destructive' &&
                                                    'text-destructive focus:text-destructive'
                                                )}
                                            >
                                                {action.icon && (
                                                    <span className="mr-2">{action.icon}</span>
                                                )}
                                                {action.label}
                                            </DropdownMenuItem>
                                        </div>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                {badges && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {badges}
                    </div>
                )}
            </CardHeader>
            {(content || footer) && (
                <CardContent className="pt-0">
                    {content}
                    {footer && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                            {footer}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

interface ModuleCardGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4;
    className?: string;
}

export function ModuleCardGrid({ children, columns = 3, className }: ModuleCardGridProps) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-2 lg:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {children}
        </div>
    );
}
