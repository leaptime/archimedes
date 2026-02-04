import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, TrendingUp, Clock, Star, ArrowRight, Filter, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleCard } from './ModuleCard';
import { FeaturedModuleCard } from './FeaturedModuleCard';
import { CategoryCard } from './CategoryCard';
import { mockModules } from '@/data/modules';
import { ModuleCategory, CATEGORY_LABELS } from '@/types/module';

const categories: { key: ModuleCategory; icon: string; count: number }[] = [
    { key: 'invoicing', icon: 'FileText', count: 1 },
    { key: 'crm', icon: 'Users', count: 1 },
    { key: 'erp', icon: 'Building2', count: 1 },
    { key: 'survey', icon: 'ClipboardList', count: 1 },
    { key: 'hr', icon: 'UserCheck', count: 1 },
    { key: 'analytics', icon: 'BarChart3', count: 1 },
    { key: 'communication', icon: 'MessageSquare', count: 1 },
    { key: 'project-management', icon: 'Kanban', count: 1 },
    { key: 'ecommerce', icon: 'ShoppingCart', count: 1 },
    { key: 'marketing', icon: 'Megaphone', count: 1 },
];

export function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | null>(null);

    const featuredModules = mockModules
        .filter((m) => m.rating >= 4.8 && m.status !== 'coming-soon')
        .slice(0, 3);
    const trendingModules = mockModules.filter((m) => m.installs > 10000).slice(0, 4);
    const newModules = mockModules.filter((m) => m.status === 'available').slice(0, 4);

    const filteredModules = selectedCategory
        ? mockModules.filter((m) => m.category === selectedCategory)
        : mockModules;

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20 px-6 py-12 lg:py-16">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {mockModules.length}+ Modules Available
                        </Badge>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                            Build Your Perfect SaaS Stack
                        </h1>
                        <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                            Discover powerful modules from official and third-party developers. Mix and
                            match to create your ideal business solution.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative max-w-xl mx-auto"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search for modules, categories, or features..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-primary"
                        />
                    </motion.div>
                </div>
            </div>

            <div className="p-6 space-y-10">
                {/* Featured Modules */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Featured Modules
                                </h2>
                                <p className="text-sm text-muted-foreground">Hand-picked by our team</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="gap-2 text-muted-foreground hover:text-foreground"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {featuredModules.map((module, index) => (
                            <FeaturedModuleCard key={module.id} module={module} index={index} />
                        ))}
                    </div>
                </section>

                {/* Browse by Category */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                                <Filter className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Browse by Category
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Find modules for every business need
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {categories.map((cat, index) => (
                            <CategoryCard
                                key={cat.key}
                                category={cat.key}
                                icon={cat.icon}
                                count={mockModules.filter((m) => m.category === cat.key).length}
                                index={index}
                                isSelected={selectedCategory === cat.key}
                                onClick={() =>
                                    setSelectedCategory(selectedCategory === cat.key ? null : cat.key)
                                }
                            />
                        ))}
                    </div>
                </section>

                {/* Trending & New Tabs */}
                <section>
                    <Tabs defaultValue="trending" className="w-full">
                        <TabsList className="mb-6 bg-secondary/50">
                            <TabsTrigger value="trending" className="gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Trending
                            </TabsTrigger>
                            <TabsTrigger value="new" className="gap-2">
                                <Clock className="w-4 h-4" />
                                New Releases
                            </TabsTrigger>
                            <TabsTrigger value="all" className="gap-2">
                                All Modules
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="trending" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                {trendingModules.map((module, index) => (
                                    <ModuleCard key={module.id} module={module} index={index} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="new" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                {newModules.map((module, index) => (
                                    <ModuleCard key={module.id} module={module} index={index} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="all" className="mt-0">
                            {selectedCategory && (
                                <div className="mb-4 flex items-center gap-2">
                                    <Badge variant="secondary" className="gap-1">
                                        {CATEGORY_LABELS[selectedCategory]}
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="ml-1 hover:text-foreground"
                                        >
                                            x
                                        </button>
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {filteredModules.length} modules
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                {filteredModules.map((module, index) => (
                                    <ModuleCard key={module.id} module={module} index={index} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </section>

                {/* CTA Section */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent to-primary/5 p-8 lg:p-12">
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">
                                Are you a developer?
                            </h3>
                            <p className="text-muted-foreground max-w-lg">
                                Build and publish your own modules on The Last Software marketplace.
                                Reach thousands of businesses looking for solutions like yours.
                            </p>
                        </div>
                        <Button size="lg" className="gap-2 whitespace-nowrap">
                            Become a Partner
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
                </section>
            </div>
        </div>
    );
}
