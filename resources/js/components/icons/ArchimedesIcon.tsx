import { cn } from '@/lib/utils';

interface ArchimedesIconProps {
    className?: string;
    size?: number;
}

export function ArchimedesIcon({ className, size = 24 }: ArchimedesIconProps) {
    return (
        <svg
            viewBox="0 0 32 32"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(className)}
        >
            {/* Hexagon outline */}
            <path
                d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
            />
            {/* Letter A inside */}
            <path
                d="M16 8L11 22H13.5L14.5 19H17.5L18.5 22H21L16 8Z"
                fill="currentColor"
            />
            {/* A crossbar cutout */}
            <path
                d="M15 16.5H17L16.5 15H15.5L15 16.5Z"
                fill="currentColor"
                className="fill-card"
            />
        </svg>
    );
}

export function ArchimedesLogo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArchimedesIcon className="text-primary" size={22} />
            </div>
            {!collapsed && (
                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground tracking-tight">
                        Archimedes Factory
                    </span>
                    <span className="text-xs text-muted-foreground">Module Platform</span>
                </div>
            )}
        </div>
    );
}
