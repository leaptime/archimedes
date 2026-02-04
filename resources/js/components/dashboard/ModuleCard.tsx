import { motion } from 'framer-motion';
import {
    FileText,
    Users,
    Building2,
    ClipboardList,
    UserCheck,
    BarChart3,
    MessageSquare,
    Kanban,
    ShoppingCart,
    Megaphone,
    Check,
    Download,
    Clock,
    Star,
    ExternalLink,
} from 'lucide-react';
import { Module, CATEGORY_LABELS } from '@/types/module';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
    FileText,
    Users,
    Building2,
    ClipboardList,
    UserCheck,
    BarChart3,
    MessageSquare,
    Kanban,
    ShoppingCart,
    Megaphone,
};

interface ModuleCardProps {
    module: Module;
    index: number;
}

export function ModuleCard({ module, index }: ModuleCardProps) {
    const Icon = iconMap[module.icon] || FileText;

    const getStatusLabel = () => {
        switch (module.status) {
            case 'installed':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <Check className="w-3 h-3" />
                        Installed
                    </span>
                );
            case 'coming-soon':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Coming Soon
                    </span>
                );
            default:
                return null;
        }
    };

    const getPriceLabel = () => {
        if (module.price.type === 'free') return 'Free';
        if (module.price.type === 'freemium') return `Free / $${module.price.amount}`;
        return `$${module.price.amount}/${module.price.period}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className={cn(
                'group bg-card border border-border rounded-lg p-4',
                'hover:border-foreground/20 transition-colors duration-150',
                'flex flex-col'
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'w-9 h-9 rounded-md flex items-center justify-center',
                            module.provider === 'platform'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-muted-foreground'
                        )}
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-medium text-foreground leading-tight">
                            {module.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {module.provider === 'platform' ? (
                                <span className="text-primary">Official</span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    {module.providerName}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                {getStatusLabel()}
            </div>

            {/* Category */}
            <span
                className={cn(
                    'inline-flex items-center w-fit px-2 py-0.5 rounded text-[11px] font-medium mb-2',
                    'bg-secondary text-secondary-foreground'
                )}
            >
                {CATEGORY_LABELS[module.category]}
            </span>

            {/* Description */}
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-grow">
                {module.description}
            </p>

            {/* Stats */}
            {module.status !== 'coming-soon' && (
                <div className="flex items-center gap-4 mb-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-medium text-foreground">{module.rating}</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {(module.installs / 1000).toFixed(1)}k
                    </span>
                    <span className="font-mono text-[11px]">v{module.version}</span>
                </div>
            )}

            {/* Price & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
                <span
                    className={cn(
                        'text-[13px] font-medium',
                        module.price.type === 'free' ? 'text-emerald-600' : 'text-foreground'
                    )}
                >
                    {getPriceLabel()}
                </span>

                {module.status === 'installed' ? (
                    <Button variant="outline" size="sm" className="h-7 text-[12px]">
                        Manage
                    </Button>
                ) : module.status === 'coming-soon' ? (
                    <Button variant="outline" size="sm" className="h-7 text-[12px]" disabled>
                        Notify Me
                    </Button>
                ) : (
                    <Button size="sm" className="h-7 text-[12px] gap-1">
                        <Download className="w-3 h-3" />
                        Install
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
