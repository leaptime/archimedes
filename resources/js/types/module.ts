export interface Module {
    id: string;
    name: string;
    description: string;
    category: ModuleCategory;
    provider: ModuleProvider;
    providerName: string;
    icon: string;
    status: ModuleStatus;
    version: string;
    rating: number;
    installs: number;
    features: string[];
    price: ModulePrice;
}

export type ModuleCategory =
    | 'invoicing'
    | 'crm'
    | 'erp'
    | 'survey'
    | 'hr'
    | 'analytics'
    | 'communication'
    | 'project-management'
    | 'ecommerce'
    | 'marketing';

export type ModuleProvider = 'platform' | 'third-party';

export type ModuleStatus = 'installed' | 'available' | 'coming-soon';

export interface ModulePrice {
    type: 'free' | 'paid' | 'freemium';
    amount?: number;
    period?: 'month' | 'year' | 'one-time';
}

export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
    invoicing: 'Invoicing',
    crm: 'CRM',
    erp: 'ERP',
    survey: 'Survey System',
    hr: 'Human Resources',
    analytics: 'Analytics',
    communication: 'Communication',
    'project-management': 'Project Management',
    ecommerce: 'E-commerce',
    marketing: 'Marketing',
};

export const CATEGORY_COLORS: Record<ModuleCategory, string> = {
    invoicing: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    crm: 'bg-blue-500/10 text-blue-600 border-blue-200',
    erp: 'bg-purple-500/10 text-purple-600 border-purple-200',
    survey: 'bg-amber-500/10 text-amber-600 border-amber-200',
    hr: 'bg-pink-500/10 text-pink-600 border-pink-200',
    analytics: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    communication: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    'project-management': 'bg-orange-500/10 text-orange-600 border-orange-200',
    ecommerce: 'bg-rose-500/10 text-rose-600 border-rose-200',
    marketing: 'bg-teal-500/10 text-teal-600 border-teal-200',
};
