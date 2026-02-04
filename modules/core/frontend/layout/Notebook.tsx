import React, { ReactNode, useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface NotebookContextValue {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const NotebookContext = createContext<NotebookContextValue | null>(null);

function useNotebook() {
    const context = useContext(NotebookContext);
    if (!context) {
        throw new Error('Page must be used within a Notebook');
    }
    return context;
}

interface NotebookProps {
    defaultTab?: string;
    className?: string;
    children: ReactNode;
}

/**
 * Notebook - Tabbed container component
 */
export function Notebook({ 
    defaultTab, 
    className, 
    children 
}: NotebookProps) {
    // Extract page children to get their names for tabs
    const pages = React.Children.toArray(children).filter(
        (child): child is React.ReactElement => 
            React.isValidElement(child) && (child.type === Page || (child.type as any).displayName === 'Page')
    );

    const [activeTab, setActiveTab] = useState(
        defaultTab || pages[0]?.props?.name || ''
    );

    return (
        <NotebookContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={cn('space-y-0', className)}>
                {/* Tab headers */}
                <div className="flex border-b border-border overflow-x-auto">
                    {pages.map((page) => {
                        const { name, label, icon, badge } = page.props;
                        const isActive = activeTab === name;
                        
                        return (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setActiveTab(name)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap',
                                    'border-b-2 transition-colors -mb-px',
                                    isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                                )}
                            >
                                {icon && <span className="w-4 h-4">{icon}</span>}
                                {label}
                                {badge !== undefined && (
                                    <span className={cn(
                                        'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                                        isActive 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'bg-muted text-muted-foreground'
                                    )}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div className="pt-4">
                    {children}
                </div>
            </div>
        </NotebookContext.Provider>
    );
}

interface PageProps {
    name: string;
    label: string;
    icon?: ReactNode;
    badge?: number | string;
    className?: string;
    children: ReactNode;
}

/**
 * Page - Tab page component (used inside Notebook)
 */
export function Page({ 
    name, 
    label,
    icon,
    badge,
    className, 
    children 
}: PageProps) {
    const { activeTab } = useNotebook();
    
    if (activeTab !== name) {
        return null;
    }

    return (
        <div 
            className={cn('animate-in fade-in-50 duration-200', className)}
            role="tabpanel"
            aria-labelledby={`tab-${name}`}
        >
            {children}
        </div>
    );
}

Page.displayName = 'Page';
