import { cn } from '@/lib/utils';
import { NavLink } from '@/components/NavLink';
import {
    LayoutDashboard,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Layers,
    Users,
    FileText,
    Landmark,
    BookOpen,
    Target,
    type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArchimedesIcon } from '@/components/icons/ArchimedesIcon';

interface AppSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    hasSubmenu?: boolean;
    submenu?: { title: string; url: string }[];
}

// Main navigation - Dashboard and Modules
const mainNavItems: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

// Module navigation items - active modules with UI
const moduleNavItems: NavItem[] = [
    { title: 'Contacts', url: '/contacts', icon: Users },
    { title: 'CRM', url: '/crm', icon: Target },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Cash Book', url: '/cashbook', icon: BookOpen },
    { title: 'Banking', url: '/banking', icon: Landmark },
];

// Management - single link, no submenu
const managementItem: NavItem = {
    title: 'Management',
    url: '/management',
    icon: Layers,
    hasSubmenu: false,
};

const bottomNavItems: NavItem[] = [
    { title: 'Help', url: '/help', icon: HelpCircle },
];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'flex flex-col h-screen bg-card',
                'fixed left-0 top-0 z-40',
                'border-r border-border'
            )}
        >
            {/* Logo with collapse button */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ArchimedesIcon className="text-primary" size={22} />
                    </div>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col"
                            >
                                <span className="font-semibold text-sm text-foreground tracking-tight">
                                    Archimedes Factory
                                </span>
                                <span className="text-xs text-muted-foreground">Module Platform</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {/* Collapse Toggle - now on the right of logo */}
                <button
                    onClick={onToggle}
                    className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-md',
                        'text-muted-foreground',
                        'hover:text-foreground hover:bg-accent',
                        'transition-colors duration-100'
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Main Menu Label */}
            {!collapsed && (
                <div className="px-5 pt-6 pb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Main Menu
                    </span>
                </div>
            )}

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-none">
                {/* Dashboard */}
                {mainNavItems.map((item) => (
                    <NavLink
                        key={item.title}
                        to={item.url}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                            'text-muted-foreground',
                            'hover:text-foreground hover:bg-accent',
                            'transition-colors duration-100',
                            collapsed && 'justify-center px-2'
                        )}
                        activeClassName="text-foreground bg-accent"
                    >
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="text-sm font-medium"
                                >
                                    {item.title}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}

                {/* Modules Section */}
                {!collapsed && (
                    <div className="px-2 pt-4 pb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Modules
                        </span>
                    </div>
                )}
                {collapsed && <div className="h-3" />}
                
                {moduleNavItems.map((item) => (
                    <NavLink
                        key={item.title}
                        to={item.url}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                            'text-muted-foreground',
                            'hover:text-foreground hover:bg-accent',
                            'transition-colors duration-100',
                            collapsed && 'justify-center px-2'
                        )}
                        activeClassName="text-foreground bg-accent"
                    >
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="text-sm font-medium"
                                >
                                    {item.title}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}

                {/* Management Section */}
                {!collapsed && (
                    <div className="px-2 pt-4 pb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Platform
                        </span>
                    </div>
                )}
                {collapsed && <div className="h-3" />}

                <NavLink
                    to={managementItem.url}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                        'text-muted-foreground',
                        'hover:text-foreground hover:bg-accent',
                        'transition-colors duration-100',
                        collapsed && 'justify-center px-2'
                    )}
                    activeClassName="text-foreground bg-accent"
                >
                    <managementItem.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                className="text-sm font-medium"
                            >
                                {managementItem.title}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </NavLink>
            </nav>

            {/* Bottom Navigation */}
            <div className="px-3 py-4 space-y-1 border-t border-border">
                {bottomNavItems.map((item) => (
                    <NavLink
                        key={item.title}
                        to={item.url}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                            'text-muted-foreground',
                            'hover:text-foreground hover:bg-accent',
                            'transition-colors duration-100',
                            collapsed && 'justify-center px-2'
                        )}
                        activeClassName="text-foreground bg-accent"
                    >
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="text-sm font-medium"
                                >
                                    {item.title}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </div>
        </motion.aside>
    );
}
