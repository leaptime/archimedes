import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';

const SIDEBAR_STORAGE_KEY = 'archimedes-sidebar-collapsed';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Initialize from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            return stored === 'true';
        }
        return false;
    });

    const handleToggle = () => {
        setSidebarCollapsed(prev => {
            const newValue = !prev;
            localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newValue));
            return newValue;
        });
    };

    return (
        <div className="flex min-h-screen w-full bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={handleToggle} />
            <motion.main
                initial={false}
                animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1 min-h-screen"
            >
                {children}
            </motion.main>
        </div>
    );
}
