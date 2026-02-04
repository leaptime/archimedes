import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Settings, 
    Power, 
    RefreshCw, 
    ExternalLink, 
    Package, 
    Boxes, 
    GitBranch,
    Users,
    FileText,
    Shield,
    Puzzle,
    Info,
} from 'lucide-react';
import { useModules, useModuleStats, Module } from '@/hooks/use-modules';
import { Link } from 'react-router-dom';

const categoryIcons: Record<string, React.ReactNode> = {
    'System': <Shield className="w-5 h-5" />,
    'CRM': <Users className="w-5 h-5" />,
    'Finance': <FileText className="w-5 h-5" />,
    'General': <Package className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
    'System': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'CRM': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'Finance': 'bg-green-500/10 text-green-600 dark:text-green-400',
    'General': 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

function ModuleCard({ module, index }: { module: Module; index: number }) {
    const IconComponent = categoryIcons[module.category] || <Package className="w-5 h-5" />;
    const colorClass = categoryColors[module.category] || categoryColors['General'];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                    {IconComponent}
                </div>
                <div>
                    <h3 className="font-medium text-foreground">{module.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                        {module.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge
                            variant="outline"
                            className={`text-xs ${
                                module.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30'
                            }`}
                        >
                            {module.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">v{module.version}</span>
                        <Badge variant="outline" className="text-xs">
                            {module.category}
                        </Badge>
                        {module.depends.length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {module.depends.length} deps
                            </span>
                        )}
                        {module.extends.length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Puzzle className="w-3 h-3" />
                                Extends {module.extends.join(', ')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">{module.author}</p>
                    <p className="text-xs text-muted-foreground">{module.license}</p>
                </div>

                <div className="flex items-center gap-1">
                    <Link to={`/modules/${module.id}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            title="View details"
                        >
                            <Info className="w-4 h-4" />
                        </Button>
                    </Link>
                    {module.hasSettings && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    )}
                    {module.navigation?.main && module.navigation.main.length > 0 && (
                        <Link to={module.navigation.main[0].path}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                                title="Open module"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                    {module.id !== 'core' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            title={module.status === 'active' ? 'Disable module' : 'Enable module'}
                        >
                            <Power className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function StatCard({ 
    title, 
    value, 
    icon, 
    delay = 0,
    valueClassName = 'text-foreground'
}: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode;
    delay?: number;
    valueClassName?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-card rounded-xl border border-border p-5"
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{title}</p>
                <div className="text-muted-foreground">{icon}</div>
            </div>
            <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
        </motion.div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export default function MyModules() {
    const { data: modules, isLoading: modulesLoading, error: modulesError } = useModules();
    const { data: stats, isLoading: statsLoading } = useModuleStats();

    const isLoading = modulesLoading || statsLoading;

    if (modulesError) {
        return (
            <DashboardLayout>
                <DashboardHeader title="My Modules" subtitle="Manage your installed modules" />
                <div className="p-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                        <p className="text-destructive font-medium">Failed to load modules</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Please make sure you are logged in and try again.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader title="My Modules" subtitle="Manage your installed modules" />
            <div className="p-6">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : (
                    <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                            <StatCard
                                title="Total Modules"
                                value={stats?.total ?? 0}
                                icon={<Boxes className="w-5 h-5" />}
                                delay={0}
                            />
                            <StatCard
                                title="Active Modules"
                                value={stats?.active ?? 0}
                                icon={<Package className="w-5 h-5" />}
                                delay={0.1}
                                valueClassName="text-emerald-500"
                            />
                            <StatCard
                                title="Categories"
                                value={Object.keys(stats?.byCategory ?? {}).length}
                                icon={<GitBranch className="w-5 h-5" />}
                                delay={0.2}
                            />
                            <StatCard
                                title="Extensions"
                                value={modules?.filter(m => m.extends.length > 0).length ?? 0}
                                icon={<Puzzle className="w-5 h-5" />}
                                delay={0.3}
                            />
                        </div>

                        {/* Category Overview */}
                        {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="mb-6 p-4 bg-muted/50 rounded-xl"
                            >
                                <p className="text-sm font-medium mb-3">Modules by Category</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(stats.byCategory).map(([category, count]) => (
                                        <Badge
                                            key={category}
                                            variant="secondary"
                                            className="text-sm py-1 px-3"
                                        >
                                            {category}: {count}
                                        </Badge>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Installed Modules List */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Installed Modules</h2>

                            <div className="space-y-3">
                                {modules?.map((module, index) => (
                                    <ModuleCard key={module.id} module={module} index={index} />
                                ))}
                            </div>

                            {(!modules || modules.length === 0) && (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        No modules installed yet.
                                    </p>
                                    <Link to="/marketplace">
                                        <Button>Browse Marketplace</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
