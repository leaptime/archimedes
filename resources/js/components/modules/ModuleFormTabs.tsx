import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Tab {
    value: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
    disabled?: boolean;
}

interface ModuleFormTabsProps {
    tabs: Tab[];
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
}

export function ModuleFormTabs({
    tabs,
    defaultValue,
    value,
    onValueChange,
    className,
}: ModuleFormTabsProps) {
    return (
        <Tabs
            defaultValue={defaultValue || tabs[0]?.value}
            value={value}
            onValueChange={onValueChange}
            className={className}
        >
            <TabsList className="mb-4">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        disabled={tab.disabled}
                        className="gap-2"
                    >
                        {tab.icon}
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    {tab.content}
                </TabsContent>
            ))}
        </Tabs>
    );
}
