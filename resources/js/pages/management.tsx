import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Users, 
    Shield, 
    Network, 
    FolderOpen, 
    ChevronRight,
    UserPlus,
    Key,
    Globe,
    HardDrive,
    Settings2,
    Boxes,
    Store,
    Wand2,
    ArrowUpCircle,
    Package,
    LayoutGrid,
    Building2,
    Book,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ManagementCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    badge?: string;
    stats?: { label: string; value: string }[];
    delay?: number;
}

function ManagementCard({ title, description, icon, href, badge, stats, delay = 0 }: ManagementCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Link
                to={href}
                className="block p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        {icon}
                    </div>
                    {badge && (
                        <Badge variant="secondary" className="text-xs">
                            {badge}
                        </Badge>
                    )}
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {description}
                </p>

                {stats && stats.length > 0 && (
                    <div className="flex gap-4 mb-4 pt-4 border-t border-border">
                        {stats.map((stat, index) => (
                            <div key={index}>
                                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center text-sm font-medium text-primary">
                    Manage
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        </motion.div>
    );
}

export default function Management() {
    // Modules section cards
    const modulesSections = [
        {
            title: 'My Modules',
            description: 'View and manage all installed modules. Configure module settings and check compliance status.',
            icon: <Boxes className="w-6 h-6 text-primary" />,
            href: '/my-modules',
            stats: [
                { label: 'Installed', value: '7' },
                { label: 'Active', value: '7' },
            ],
        },
        {
            title: 'Marketplace',
            description: 'Browse and install new modules from the marketplace. Discover extensions to expand functionality.',
            icon: <Store className="w-6 h-6 text-primary" />,
            href: '/marketplace',
            badge: 'New modules',
            stats: [
                { label: 'Available', value: '50+' },
                { label: 'Categories', value: '8' },
            ],
        },
        {
            title: 'Module Wizard',
            description: 'Create new modules with guided setup. Generate boilerplate code and configurations automatically.',
            icon: <Wand2 className="w-6 h-6 text-primary" />,
            href: '/wizard',
            stats: [
                { label: 'Templates', value: '5' },
            ],
        },
        {
            title: 'Upgrades',
            description: 'Check for module updates and upgrade to newer versions. View changelog and breaking changes.',
            icon: <ArrowUpCircle className="w-6 h-6 text-primary" />,
            href: '/upgrades',
            stats: [
                { label: 'Updates', value: '2' },
            ],
        },
    ];

    // Team & Security section cards
    const teamSections = [
        {
            title: 'Team Members',
            description: 'Manage team members, roles, and permissions. Invite new members and organize your team structure.',
            icon: <Users className="w-6 h-6 text-primary" />,
            href: '/team',
            badge: '3 members',
            stats: [
                { label: 'Active', value: '3' },
                { label: 'Pending', value: '1' },
            ],
        },
        {
            title: 'Permissions',
            description: 'Manage permission groups, access rules, and record-level security. Control who can see and do what.',
            icon: <Shield className="w-6 h-6 text-primary" />,
            href: '/permissions',
            stats: [
                { label: 'Groups', value: '9' },
                { label: 'Rules', value: '15' },
            ],
        },
        {
            title: 'Company Settings',
            description: 'Manage company profile, billing information, subscription plans, and regional preferences.',
            icon: <Building2 className="w-6 h-6 text-primary" />,
            href: '/company-settings',
            stats: [
                { label: 'Plan', value: 'Pro' },
            ],
        },
    ];

    // System section cards
    const systemSections = [
        {
            title: 'Network Settings',
            description: 'Configure network policies, webhooks, and external integrations.',
            icon: <Network className="w-6 h-6 text-primary" />,
            href: '/management/network',
            stats: [
                { label: 'Webhooks', value: '5' },
                { label: 'Integrations', value: '3' },
            ],
        },
        {
            title: 'Data Storage',
            description: 'Manage data retention policies, backups, and storage configurations.',
            icon: <FolderOpen className="w-6 h-6 text-primary" />,
            href: '/management/storage',
            stats: [
                { label: 'Used', value: '2.4 GB' },
                { label: 'Limit', value: '10 GB' },
            ],
        },
        {
            title: 'Documentation',
            description: 'Comprehensive architecture documentation covering modules, extensions, permissions, and multi-tenancy.',
            icon: <Book className="w-6 h-6 text-primary" />,
            href: '/documentation',
            stats: [
                { label: 'Sections', value: '9' },
            ],
        },
    ];

    const quickActions = [
        { title: 'Browse Modules', icon: <Store className="w-4 h-4" />, href: '/marketplace' },
        { title: 'Create Module', icon: <Wand2 className="w-4 h-4" />, href: '/wizard' },
        { title: 'Invite Member', icon: <UserPlus className="w-4 h-4" />, href: '/team' },
        { title: 'Manage Permissions', icon: <Key className="w-4 h-4" />, href: '/permissions' },
    ];

    return (
        <DashboardLayout>
            <DashboardHeader title="Management" subtitle="Manage modules, team, and platform settings" />
            <div className="p-6">
                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action) => (
                            <Link key={action.title} to={action.href}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    {action.icon}
                                    {action.title}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Tabbed Sections */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Tabs defaultValue="modules" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="modules" className="gap-2">
                                <Package className="w-4 h-4" />
                                Modules
                            </TabsTrigger>
                            <TabsTrigger value="team" className="gap-2">
                                <Users className="w-4 h-4" />
                                Team & Security
                            </TabsTrigger>
                            <TabsTrigger value="system" className="gap-2">
                                <Settings2 className="w-4 h-4" />
                                System
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="modules">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {modulesSections.map((section, index) => (
                                    <ManagementCard
                                        key={section.title}
                                        {...section}
                                        delay={index * 0.05}
                                    />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="team">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {teamSections.map((section, index) => (
                                    <ManagementCard
                                        key={section.title}
                                        {...section}
                                        delay={index * 0.05}
                                    />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="system">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {systemSections.map((section, index) => (
                                    <ManagementCard
                                        key={section.title}
                                        {...section}
                                        delay={index * 0.05}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </motion.div>

                {/* Organization Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 p-6 bg-muted/50 rounded-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-medium text-foreground">Platform Overview</h3>
                        </div>
                        <Badge variant="outline">Free Plan</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-background rounded-lg">
                            <p className="text-2xl font-bold text-foreground">7</p>
                            <p className="text-sm text-muted-foreground">Active Modules</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <p className="text-2xl font-bold text-foreground">3</p>
                            <p className="text-sm text-muted-foreground">Team Members</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <p className="text-2xl font-bold text-foreground">9</p>
                            <p className="text-sm text-muted-foreground">Permission Groups</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <p className="text-2xl font-bold text-foreground">2.4 GB</p>
                            <p className="text-sm text-muted-foreground">Storage Used</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <p className="text-2xl font-bold text-foreground">99.9%</p>
                            <p className="text-sm text-muted-foreground">Uptime</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
