import { ReactNode } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';

interface ModulePageProps {
    title: string;
    subtitle?: string;
    backLink?: string;
    actions?: ReactNode;
    children: ReactNode;
    loading?: boolean;
}

export function ModulePage({
    title,
    subtitle,
    backLink,
    actions,
    children,
    loading = false,
}: ModulePageProps) {
    return (
        <DashboardLayout>
            <DashboardHeader
                title={title}
                subtitle={subtitle}
                backLink={backLink}
            >
                {actions}
            </DashboardHeader>
            <ModuleContent loading={loading}>
                {children}
            </ModuleContent>
        </DashboardLayout>
    );
}

interface ModuleContentProps {
    children: ReactNode;
    loading?: boolean;
    className?: string;
}

function ModuleContent({ children, loading, className }: ModuleContentProps) {
    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className={className || 'p-6 space-y-6'}>
            {children}
        </div>
    );
}

export { ModuleContent };
