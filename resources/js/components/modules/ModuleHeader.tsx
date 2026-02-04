import { ReactNode } from 'react';

interface ModuleHeaderProps {
    title: string;
    subtitle?: string;
    children?: ReactNode; // Actions slot
}

export function ModuleHeader({ title, subtitle, children }: ModuleHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
