import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Book,
    Layers,
    Puzzle,
    Shield,
    Database,
    Code,
    Box,
    Users,
    Building2,
    Globe,
    Zap,
    FileCode,
    GitBranch,
    CheckCircle,
    ArrowRight,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation sections
const sections = [
    { id: 'overview', title: 'Overview', icon: Book },
    { id: 'modules', title: 'Module System', icon: Box },
    { id: 'plugins', title: 'Plugin Architecture', icon: Puzzle },
    { id: 'trust-levels', title: 'Trust Levels', icon: Shield },
    { id: 'multi-tenant', title: 'Multi-Tenancy', icon: Building2 },
    { id: 'permissions', title: 'Permissions', icon: Users },
    { id: 'slots', title: 'UI Slots', icon: Layers },
    { id: 'custom-fields', title: 'Custom Fields', icon: Database },
    { id: 'creating-plugins', title: 'Creating Plugins', icon: Code },
];

function NavItem({ id, title, icon: Icon, active, onClick }: { 
    id: string; 
    title: string; 
    icon: typeof Book; 
    active: boolean; 
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                active 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {title}
        </button>
    );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof Book }) {
    return (
        <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            {children}
        </h2>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{title}</h3>
            {children}
        </div>
    );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
    return (
        <div className="my-4">
            {title && <p className="text-xs text-muted-foreground mb-1 font-mono">{title}</p>}
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{children}</code>
            </pre>
        </div>
    );
}

function DiagramBox({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("border-2 border-dashed rounded-lg p-3 text-center text-sm font-medium", className)}>
            {children}
        </div>
    );
}

function TrustLevelCard({ level, name, color, capabilities }: { 
    level: string; 
    name: string; 
    color: string; 
    capabilities: string[];
}) {
    return (
        <div className={cn("border rounded-lg p-4", color)}>
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={color}>{level}</Badge>
                <span className="font-semibold">{name}</span>
            </div>
            <ul className="text-sm space-y-1">
                {capabilities.map((cap, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {cap}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Documentation() {
    const [activeSection, setActiveSection] = useState('overview');

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <DashboardLayout>
            <DashboardHeader 
                title="Architecture Documentation" 
                subtitle="Comprehensive guide to the platform architecture" 
            />
            <div className="flex h-[calc(100vh-8rem)]">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-border p-4 flex-shrink-0">
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <NavItem
                                key={section.id}
                                {...section}
                                active={activeSection === section.id}
                                onClick={() => scrollToSection(section.id)}
                            />
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-8">
                    <div className="max-w-4xl space-y-12">
                        
                        {/* Overview */}
                        <section id="overview">
                            <SectionTitle icon={Book}>Overview</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                Archimedes is a modular ERP platform built with Laravel and React, inspired by Odoo's 
                                extensibility model. The architecture supports multi-tenancy, a tiered extension system, 
                                and fine-grained permissions.
                            </p>
                            
                            <div className="grid md:grid-cols-3 gap-4 my-6">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Box className="h-8 w-8 mx-auto mb-2 text-primary" />
                                        <h4 className="font-semibold">Modular</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Core + business modules with clear boundaries
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Puzzle className="h-8 w-8 mx-auto mb-2 text-primary" />
                                        <h4 className="font-semibold">Extensible</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Third-party extensions with tiered trust
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                                        <h4 className="font-semibold">Multi-Tenant</h4>
                                        <p className="text-sm text-muted-foreground">
                                            PostgreSQL RLS for data isolation
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <SubSection title="Architecture Layers">
                                <div className="space-y-2">
                                    <DiagramBox className="border-amber-500 bg-amber-50">
                                        <span className="text-amber-700">L4: Core Modules</span>
                                        <span className="text-xs text-amber-600 block">Full system access • Core modules only</span>
                                    </DiagramBox>
                                    <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>
                                    <DiagramBox className="border-purple-500 bg-purple-50">
                                        <span className="text-purple-700">L3: Certified Plugins</span>
                                        <span className="text-xs text-purple-600 block">Custom models, migrations • Certified partners</span>
                                    </DiagramBox>
                                    <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>
                                    <DiagramBox className="border-blue-500 bg-blue-50">
                                        <span className="text-blue-700">L2: Verified Plugins</span>
                                        <span className="text-xs text-blue-600 block">Custom fields, write APIs • Verified partners</span>
                                    </DiagramBox>
                                    <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>
                                    <DiagramBox className="border-slate-500 bg-slate-50">
                                        <span className="text-slate-700">L1: Community Plugins</span>
                                        <span className="text-xs text-slate-600 block">UI slots, read-only API • Anyone</span>
                                    </DiagramBox>
                                </div>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Module System */}
                        <section id="modules">
                            <SectionTitle icon={Box}>Module System</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                Modules are self-contained units that provide specific business functionality. 
                                Each module has its own models, controllers, views, and frontend components.
                            </p>

                            <SubSection title="Directory Structure">
                                <CodeBlock title="modules/{module-name}/">{`modules/
├── core/                    # Core module (required)
│   ├── manifest.json        # Module metadata
│   ├── src/
│   │   ├── Models/          # Eloquent models
│   │   ├── Controllers/     # API controllers
│   │   ├── Services/        # Business logic
│   │   └── routes/          # Route definitions
│   ├── frontend/            # React components
│   ├── database/
│   │   └── migrations/      # Database migrations
│   └── tests/               # E2E tests
├── contacts/                # Contacts module
├── invoicing/               # Invoicing module
├── crm/                     # CRM module
└── ...`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Module Manifest">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Every module must have a <code className="bg-muted px-1 rounded">manifest.json</code> file:
                                </p>
                                <CodeBlock title="manifest.json">{`{
    "id": "contacts",
    "name": "Contacts",
    "version": "1.0.0",
    "description": "Contact and company management",
    "category": "CRM",
    "depends": ["core"],
    "models": [
        { "name": "Contact", "table": "contacts" }
    ],
    "pages": [
        { "path": "/contacts", "title": "Contacts" }
    ],
    "extensionPoints": [
        "contacts.form.after-email",
        "contacts.detail.sidebar"
    ]
}`}</CodeBlock>
                            </SubSection>

                            <SubSection title="ExtendableModel">
                                <p className="text-sm text-muted-foreground mb-3">
                                    All business models should extend <code className="bg-muted px-1 rounded">ExtendableModel</code> 
                                    to enable field extensions and hooks:
                                </p>
                                <CodeBlock title="Contact.php">{`<?php

namespace Modules\\Contacts\\Models;

use Modules\\Core\\Models\\ExtendableModel;

class Contact extends ExtendableModel
{
    public const MODEL_IDENTIFIER = 'contacts.contact';
    
    protected $fillable = ['name', 'email', 'phone'];
    
    // Model automatically supports:
    // - Dynamic field extensions
    // - Organization scoping (multi-tenant)
    // - Record-level permissions
}`}</CodeBlock>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Plugin Architecture */}
                        <section id="plugins">
                            <SectionTitle icon={Puzzle}>Plugin Architecture</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                Plugins extend modules with custom features, fields, and integrations without modifying core code.
                                While modules provide complete business functionality (like Invoicing or CRM), plugins add enhancements to them.
                            </p>

                            <SubSection title="Modules vs Plugins">
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <Box className="h-6 w-6 text-primary mb-2" />
                                            <h4 className="font-semibold">Module</h4>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Complete business functionality that solves a problem
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Examples: Invoicing, CRM, Contacts, Banking
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <Puzzle className="h-6 w-6 text-purple-600 mb-2" />
                                            <h4 className="font-semibold">Plugin</h4>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Extends/customizes one or more modules
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Examples: Custom reports, integrations, extra fields
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </SubSection>

                            <SubSection title="Plugin Types">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <Globe className="h-6 w-6 text-green-600 mb-2" />
                                            <h4 className="font-semibold">Global Plugins</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Available to all organizations. Stored in <code className="bg-muted px-1 rounded text-xs">plugins/</code>
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <Building2 className="h-6 w-6 text-orange-600 mb-2" />
                                            <h4 className="font-semibold">Tenant Plugins</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Per-organization customizations. Stored in <code className="bg-muted px-1 rounded text-xs">tenants/{'{org_id}'}/plugins/</code>
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </SubSection>

                            <SubSection title="Plugin Directory Structure">
                                <CodeBlock title="plugins/{plugin-name}/">{`plugins/
└── contact-social-links/
    ├── manifest.json        # Plugin manifest
    ├── frontend/            # React components
    │   ├── SocialLinksForm.tsx
    │   └── SocialLinksDisplay.tsx
    ├── src/                 # PHP backend (L2+)
    │   ├── Models/
    │   ├── Controllers/
    │   └── handlers/
    └── migrations/          # Database migrations (L3)`}</CodeBlock>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Trust Levels */}
                        <section id="trust-levels">
                            <SectionTitle icon={Shield}>Trust Levels</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                Plugins are categorized by trust level, which determines what capabilities they can use.
                                Higher trust levels require verification and certification.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <TrustLevelCard
                                    level="L1"
                                    name="Community"
                                    color="border-slate-300 bg-slate-50"
                                    capabilities={[
                                        "UI extension points",
                                        "Read-only API access",
                                        "UI widgets",
                                    ]}
                                />
                                <TrustLevelCard
                                    level="L2"
                                    name="Verified"
                                    color="border-blue-300 bg-blue-50"
                                    capabilities={[
                                        "Everything in L1",
                                        "Custom fields on models",
                                        "Write API access",
                                        "Webhooks",
                                        "Custom routes",
                                    ]}
                                />
                                <TrustLevelCard
                                    level="L3"
                                    name="Certified"
                                    color="border-purple-300 bg-purple-50"
                                    capabilities={[
                                        "Everything in L2",
                                        "Custom database models",
                                        "Database migrations",
                                        "Cron jobs",
                                        "Queue jobs",
                                    ]}
                                />
                                <TrustLevelCard
                                    level="L4"
                                    name="Core"
                                    color="border-amber-300 bg-amber-50"
                                    capabilities={[
                                        "Full system access",
                                        "Core module modification",
                                        "System configuration",
                                        "Internal team only",
                                    ]}
                                />
                            </div>

                            <SubSection title="Declaring Trust Level">
                                <CodeBlock title="manifest.json">{`{
    "id": "my-plugin",
    "trustLevel": "verified",
    "extends": ["contacts >= 1.0"],
    "capabilities": [
        "ui.slots",
        "api.read",
        "api.write",
        "fields.add"
    ]
}`}</CodeBlock>
                                <p className="text-sm text-muted-foreground mt-2">
                                    The system validates that requested capabilities match the declared trust level.
                                    Requesting capabilities above your trust level will fail validation.
                                </p>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Multi-Tenancy */}
                        <section id="multi-tenant">
                            <SectionTitle icon={Building2}>Multi-Tenancy</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                The platform uses PostgreSQL Row-Level Security (RLS) for database-enforced tenant isolation.
                                Each organization's data is automatically filtered at the database level.
                            </p>

                            <SubSection title="Architecture">
                                <div className="space-y-3 my-4">
                                    <DiagramBox className="border-green-500 bg-green-50">
                                        <span className="text-green-700">Platform Admin</span>
                                        <span className="text-xs text-green-600 block">Manages partners and organizations</span>
                                    </DiagramBox>
                                    <div className="flex justify-center"><ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>
                                    <DiagramBox className="border-blue-500 bg-blue-50">
                                        <span className="text-blue-700">Partners (Resellers)</span>
                                        <span className="text-xs text-blue-600 block">Create and manage organizations</span>
                                    </DiagramBox>
                                    <div className="flex justify-center"><ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>
                                    <DiagramBox className="border-purple-500 bg-purple-50">
                                        <span className="text-purple-700">Organizations (Tenants)</span>
                                        <span className="text-xs text-purple-600 block">Isolated data with RLS policies</span>
                                    </DiagramBox>
                                    <div className="flex justify-center"><ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>
                                    <DiagramBox className="border-slate-500 bg-slate-50">
                                        <span className="text-slate-700">Users</span>
                                        <span className="text-xs text-slate-600 block">Belong to one organization</span>
                                    </DiagramBox>
                                </div>
                            </SubSection>

                            <SubSection title="How RLS Works">
                                <CodeBlock title="PostgreSQL RLS Policy">{`-- Every business table has organization_id
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy ensures users only see their organization's data
CREATE POLICY contacts_tenant_isolation ON contacts
    USING (
        organization_id::text = current_setting('app.organization_id', true)
        OR current_setting('app.is_platform_admin', true) = 'true'
    );`}</CodeBlock>
                                <p className="text-sm text-muted-foreground mt-2">
                                    The middleware sets PostgreSQL session variables based on the authenticated user.
                                    RLS policies automatically filter all queries.
                                </p>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Permissions */}
                        <section id="permissions">
                            <SectionTitle icon={Users}>Permissions</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                The permission system has four layers, inspired by Odoo's security model.
                            </p>

                            <div className="space-y-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Badge>1</Badge> Permission Groups
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Users belong to groups (e.g., "Sales User", "Sales Manager"). Groups can inherit from other groups.
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Badge>2</Badge> Access Control List (ACL)
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Model-level CRUD permissions per group. Example: "Sales User can read/create contacts".
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Badge>3</Badge> Record Rules
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Row-level filtering based on conditions. Example: "Sales User can only see their own leads".
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Badge>4</Badge> Field-Level Access
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Control which fields are visible/editable per group. Example: "Only managers see salary field".
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        <Separator />

                        {/* UI Slots */}
                        <section id="slots">
                            <SectionTitle icon={Layers}>UI Slots</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                UI slots are predefined locations in the interface where plugins can inject components.
                                They follow a naming convention: <code className="bg-muted px-1 rounded">module.page.location</code>
                            </p>

                            <SubSection title="Available Slots">
                                <div className="space-y-2 text-sm font-mono">
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <code>contacts.form.after-email</code>
                                        <span className="text-muted-foreground">→ Form fields after email</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <code>contacts.form.after-address</code>
                                        <span className="text-muted-foreground">→ Form fields after address</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <code>contacts.detail.sidebar</code>
                                        <span className="text-muted-foreground">→ Sidebar cards on detail page</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <code>contacts.detail.tabs</code>
                                        <span className="text-muted-foreground">→ Additional tabs</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <code>contacts.list.actions</code>
                                        <span className="text-muted-foreground">→ Bulk action buttons</span>
                                    </div>
                                </div>
                            </SubSection>

                            <SubSection title="Using Extension Points">
                                <CodeBlock title="In your page component">{`import { ExtensionSlot, DetailExtensionSlot } from '@/lib/extensions';

function ContactDetail({ contact, refetch }) {
    return (
        <div>
            {/* Basic usage */}
            <ExtensionSlot
                name="contacts.detail.sidebar"
                context={{ entity: contact, onRefresh: refetch }}
            />
            
            {/* Or use typed slot for detail pages */}
            <DetailExtensionSlot
                name="contacts.detail.sidebar"
                entity={contact}
                onRefresh={refetch}
            />
        </div>
    );
}`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Unified Slot System">
                                <p className="text-sm text-muted-foreground mb-3">
                                    The platform uses a unified slot system that combines static (bundled) 
                                    and dynamic (API-loaded) plugins:
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <strong>ExtensionSlot</strong> - The main component for rendering plugin components
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <strong>FormExtensionSlot</strong> - For form contexts (auto-passes data/setData)
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <strong>DetailExtensionSlot</strong> - For entity detail pages
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <strong>ListExtensionSlot</strong> - For list/table views
                                    </div>
                                </div>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Custom Fields */}
                        <section id="custom-fields">
                            <SectionTitle icon={Database}>Custom Fields</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                Plugins can add custom fields to existing models without modifying the database schema.
                                Fields are stored in a JSON column (<code className="bg-muted px-1 rounded">extension_data</code>).
                            </p>

                            <SubSection title="Declaring Custom Fields">
                                <CodeBlock title="manifest.json">{`{
    "fields": [
        {
            "model": "Contact",
            "name": "lead_score",
            "label": "Lead Score",
            "type": "integer",
            "validation": { "min": 0, "max": 100 },
            "helpText": "Score from 0-100"
        },
        {
            "model": "Contact",
            "name": "lead_temperature",
            "label": "Temperature",
            "type": "select",
            "options": [
                { "value": "cold", "label": "Cold" },
                { "value": "warm", "label": "Warm" },
                { "value": "hot", "label": "Hot" }
            ]
        }
    ]
}`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Supported Field Types">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    {['string', 'text', 'integer', 'number', 'boolean', 'date', 'datetime', 'email', 'url', 'select', 'textarea', 'json'].map(type => (
                                        <Badge key={type} variant="outline">{type}</Badge>
                                    ))}
                                </div>
                            </SubSection>

                            <SubSection title="Rendering Custom Fields">
                                <CodeBlock title="In forms">{`import { ExtensionFields, FormProvider } from '@/lib/extensions';

// Option 1: Pass data directly
function ContactForm({ data, setData, errors }) {
    return (
        <form>
            {/* ... standard fields ... */}
            <ExtensionFields
                model="Contact"
                data={data}
                setData={setData}
                errors={errors}
            />
        </form>
    );
}

// Option 2: Use FormProvider (recommended)
function ContactForm({ data, setData }) {
    return (
        <FormProvider data={data} onDataChange={setData}>
            <form>
                {/* ExtensionFields auto-inherits form context */}
                <ExtensionFields model="Contact" />
            </form>
        </FormProvider>
    );
}`}</CodeBlock>
                            </SubSection>
                        </section>

                        <Separator />

                        {/* Creating Plugins */}
                        <section id="creating-plugins">
                            <SectionTitle icon={Code}>Creating Plugins</SectionTitle>
                            <p className="text-muted-foreground mb-6">
                                Follow these steps to create a new plugin that extends a module.
                            </p>

                            <SubSection title="Step 1: Create Directory Structure">
                                <CodeBlock>{`mkdir -p plugins/my-plugin/frontend
touch plugins/my-plugin/manifest.json`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Step 2: Define Manifest">
                                <CodeBlock title="plugins/my-plugin/manifest.json">{`{
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "Extends contacts with awesome features",
    "author": "Your Name",
    "trustLevel": "community",
    "extends": ["contacts >= 1.0"],
    "capabilities": [
        "ui.slots",
        "api.read"
    ],
    "slots": [
        {
            "slot": "contacts.detail.sidebar",
            "component": "frontend/MyCard.tsx",
            "priority": 50
        }
    ]
}`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Step 3: Create Component">
                                <CodeBlock title="plugins/my-plugin/frontend/MyCard.tsx">{`import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyCardProps {
    entity: Record<string, any>;
    onRefresh?: () => void;
}

export default function MyCard({ entity }: MyCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Plugin</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Contact: {entity.name}</p>
            </CardContent>
        </Card>
    );
}`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Step 4: Register Component">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Add to <code className="bg-muted px-1 rounded">resources/js/extensions/index.ts</code>:
                                </p>
                                <CodeBlock>{`import { registerExtensionComponent } from '@/lib/extensions';
import MyCard from '@plugins/my-plugin/frontend/MyCard';

// Register for dynamic loading (matches manifest)
registerExtensionComponent(
    'my-plugin',
    'frontend/MyCard.tsx',
    MyCard
);`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Alternative: Static Registration">
                                <p className="text-sm text-muted-foreground mb-3">
                                    For module-to-module integrations (without manifest):
                                </p>
                                <CodeBlock>{`import { registerExtension } from '@/lib/extensions';
import MyCard from './MyCard';

// Register directly to a slot
registerExtension(
    'contacts.detail.sidebar',
    MyCard,
    { module: 'my-module', priority: 50 }
);`}</CodeBlock>
                            </SubSection>

                            <SubSection title="Step 5: Rebuild">
                                <CodeBlock>{`npm run build`}</CodeBlock>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Your plugin will now appear in the Plugins management page and its components
                                    will render at the configured slots.
                                </p>
                            </SubSection>
                        </section>

                        {/* Footer */}
                        <div className="pt-8 pb-16 text-center text-sm text-muted-foreground">
                            <Separator className="mb-8" />
                            <p>Archimedes Platform Architecture Documentation</p>
                            <p className="mt-1">Built with Laravel, React, PostgreSQL, and TypeScript</p>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </DashboardLayout>
    );
}
