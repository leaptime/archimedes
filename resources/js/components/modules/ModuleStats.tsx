import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCard {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        label?: string;
    };
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

interface ModuleStatsProps {
    stats: StatCard[];
    columns?: 2 | 3 | 4 | 5;
    loading?: boolean;
}

const variantStyles = {
    default: '',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
};

export function ModuleStats({ stats, columns = 4, loading = false }: ModuleStatsProps) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        5: 'md:grid-cols-5',
    };

    if (loading) {
        return (
            <div className={cn('grid gap-4', gridCols[columns])}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-24 bg-muted animate-pulse rounded mb-1" />
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className={cn('grid gap-4', gridCols[columns])}>
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        {stat.icon && (
                            <span className="text-muted-foreground">
                                {stat.icon}
                            </span>
                        )}
                    </CardHeader>
                    <CardContent>
                        <p className={cn(
                            'text-2xl font-bold',
                            stat.variant && variantStyles[stat.variant]
                        )}>
                            {stat.value}
                        </p>
                        {stat.subtitle && (
                            <p className="text-xs text-muted-foreground">
                                {stat.subtitle}
                            </p>
                        )}
                        {stat.trend && (
                            <p className={cn(
                                'text-xs mt-1',
                                stat.trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                                {stat.trend.value >= 0 ? '+' : ''}{stat.trend.value}%
                                {stat.trend.label && ` ${stat.trend.label}`}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
