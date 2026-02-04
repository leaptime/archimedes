import { ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    className?: string;
    sortable?: boolean;
}

export interface Action<T> {
    label: string;
    icon?: ReactNode;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
    separator?: boolean;
    hidden?: (item: T) => boolean;
}

interface Pagination {
    currentPage: number;
    lastPage: number;
    total: number;
    onPageChange: (page: number) => void;
}

interface ModuleListProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: Action<T>[];
    keyField: keyof T;
    loading?: boolean;
    emptyMessage?: string;
    emptyIcon?: ReactNode;
    pagination?: Pagination;
    onRowClick?: (item: T) => void;
    selectedId?: string | number;
}

export function ModuleList<T extends Record<string, any>>({
    data,
    columns,
    actions,
    keyField,
    loading = false,
    emptyMessage = 'No items found',
    emptyIcon,
    pagination,
    onRowClick,
    selectedId,
}: ModuleListProps<T>) {
    if (loading) {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.className}>
                                    {col.header}
                                </TableHead>
                            ))}
                            {actions && <TableHead className="w-12" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {columns.map((col) => (
                                    <TableCell key={col.key}>
                                        <div className="h-4 bg-muted animate-pulse rounded w-24" />
                                    </TableCell>
                                ))}
                                {actions && <TableCell />}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-md border">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    {emptyIcon && (
                        <div className="mb-4 text-muted-foreground">
                            {emptyIcon}
                        </div>
                    )}
                    <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.className}>
                                    {col.header}
                                </TableHead>
                            ))}
                            {actions && actions.length > 0 && (
                                <TableHead className="w-12" />
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow
                                key={String(item[keyField])}
                                className={cn(
                                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                                    selectedId === item[keyField] && 'bg-muted'
                                )}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((col) => (
                                    <TableCell key={col.key} className={col.className}>
                                        {col.render
                                            ? col.render(item)
                                            : item[col.key]}
                                    </TableCell>
                                ))}
                                {actions && actions.length > 0 && (
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
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
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.lastPage > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing page {pagination.currentPage} of {pagination.lastPage}
                        {' '}({pagination.total} items)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.lastPage}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
