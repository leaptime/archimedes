import { motion } from "framer-motion";
import { 
  FileText, Users, Building2, ClipboardList, UserCheck, 
  BarChart3, MessageSquare, Kanban, ShoppingCart, Megaphone,
  Star, Download, ArrowUpRight
} from "lucide-react";
import { Module, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/module";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  FileText, Users, Building2, ClipboardList, UserCheck,
  BarChart3, MessageSquare, Kanban, ShoppingCart, Megaphone,
};

interface FeaturedModuleCardProps {
  module: Module;
  index: number;
}

export function FeaturedModuleCard({ module, index }: FeaturedModuleCardProps) {
  const Icon = iconMap[module.icon] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "group relative bg-card rounded-2xl border border-border overflow-hidden",
        "hover:shadow-xl hover:border-primary/30 transition-all duration-300"
      )}
    >
      {/* Gradient Header */}
      <div className={cn(
        "h-24 relative",
        module.provider === "platform" 
          ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" 
          : "bg-gradient-to-br from-module-third-party/20 via-module-third-party/10 to-transparent"
      )}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        
        {/* Featured Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-warning/90 text-warning-foreground border-0 shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Featured
          </Badge>
        </div>

        {/* Icon */}
        <div className={cn(
          "absolute -bottom-6 left-6 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
          module.provider === "platform" 
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
            : "bg-gradient-to-br from-module-third-party to-module-third-party/80 text-white"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {module.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              by {module.providerName}
            </p>
          </div>
        </div>

        <Badge variant="outline" className={cn("mb-3 text-xs", CATEGORY_COLORS[module.category])}>
          {CATEGORY_LABELS[module.category]}
        </Badge>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {module.features.slice(0, 3).map((feature) => (
            <span key={feature} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              {feature}
            </span>
          ))}
        </div>

        {/* Stats & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="font-medium text-foreground">{module.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-4 h-4" />
              <span>{(module.installs / 1000).toFixed(1)}k</span>
            </div>
          </div>
          
          <Button size="sm" className="gap-1.5 group/btn">
            Install
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
