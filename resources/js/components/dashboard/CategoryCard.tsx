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
} from 'lucide-react';
import { ModuleCategory, CATEGORY_LABELS } from '@/types/module';
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

interface CategoryCardProps {
    category: ModuleCategory;
    icon: string;
    count: number;
    index: number;
    isSelected: boolean;
    onClick: () => void;
}

export function CategoryCard({
    category,
    icon,
    count,
    index,
    isSelected,
    onClick,
}: CategoryCardProps) {
    const Icon = iconMap[icon] || FileText;

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            onClick={onClick}
            className={cn(
                'group relative flex flex-col items-center p-5 rounded-xl border transition-all duration-200',
                'hover:shadow-md hover:border-primary/30',
                isSelected
                    ? 'bg-primary/5 border-primary shadow-md'
                    : 'bg-card border-border hover:bg-accent/50'
            )}
        >
            <div
                className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all',
                    isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}
            >
                <Icon className="w-5 h-5" />
            </div>

            <span
                className={cn(
                    'text-sm font-medium text-center transition-colors',
                    isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                )}
            >
                {CATEGORY_LABELS[category]}
            </span>

            <span className="text-xs text-muted-foreground mt-1">
                {count} {count === 1 ? 'module' : 'modules'}
            </span>

            {isSelected && (
                <motion.div
                    layoutId="categoryIndicator"
                    className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"
                />
            )}
        </motion.button>
    );
}
