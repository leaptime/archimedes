import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ChevronLeft,
    Package,
    Puzzle,
    Plug,
    Database,
    Shield,
    Settings,
    GitBranch,
    Layers,
    Code,
    FileText,
    Hash,
    ToggleLeft,
    Calendar,
    DollarSign,
    List,
    Type,
    Link as LinkIcon,
    Calculator,
    Filter,
    RefreshCw,
    ExternalLink,
    Layout,
    Component,
    Boxes,
    FormInput,
    PanelLeft,
    FileCode,
    TestTube2,
    CheckCircle2,
    Circle,
    Play,
    Globe,
    Building2,
    Users,
    ShieldCheck,
    Star,
    Eye,
    MoreVertical,
    Trash2,
    AlertTriangle,
    Map,
    Search,
    Table as TableIcon,
    PanelRight,
    LayoutGrid,
    Plus,
    MousePointer,
} from 'lucide-react';
import { useModuleDetail, useModulePlugins, ModulePlugin } from '@/hooks/use-modules';

const typeIcons: Record<string, React.ReactNode> = {
    string: <Type className="w-4 h-4" />,
    text: <FileText className="w-4 h-4" />,
    integer: <Hash className="w-4 h-4" />,
    bigInteger: <Hash className="w-4 h-4" />,
    decimal: <DollarSign className="w-4 h-4" />,
    float: <DollarSign className="w-4 h-4" />,
    boolean: <ToggleLeft className="w-4 h-4" />,
    date: <Calendar className="w-4 h-4" />,
    datetime: <Calendar className="w-4 h-4" />,
    timestamp: <Calendar className="w-4 h-4" />,
    json: <Code className="w-4 h-4" />,
    foreignId: <LinkIcon className="w-4 h-4" />,
    unsignedBigInteger: <LinkIcon className="w-4 h-4" />,
};

const widgetLabels: Record<string, string> = {
    text: 'Text Input',
    textarea: 'Text Area',
    number: 'Number Input',
    currency: 'Currency Input',
    switch: 'Toggle Switch',
    date: 'Date Picker',
    datetime: 'DateTime Picker',
    json: 'JSON Editor',
    select: 'Dropdown Select',
};

function FieldsTable({ fields }: { fields: Record<string, any> }) {
    const fieldList = Object.values(fields);
    
    if (fieldList.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No fields defined
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Widget</TableHead>
                    <TableHead>Nullable</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>References</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fieldList.map((field: any) => (
                    <TableRow key={field.name}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                {typeIcons[field.type] || <Type className="w-4 h-4" />}
                                {field.name}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                                {field.type}
                                {field.precision && `(${field.precision},${field.scale})`}
                                {field.max && `(${field.max})`}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-muted-foreground">
                                {widgetLabels[field.widget] || field.widget}
                            </span>
                        </TableCell>
                        <TableCell>
                            {field.nullable ? (
                                <Badge variant="secondary" className="text-xs">Yes</Badge>
                            ) : (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            {field.default !== null ? (
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {String(field.default)}
                                </code>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </TableCell>
                        <TableCell>
                            {field.references ? (
                                <Badge variant="outline" className="text-xs">
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    {field.references}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function RelationshipsTable({ relationships }: { relationships: any[] }) {
    if (relationships.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No relationships defined
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {relationships.map((rel: any) => (
                <div
                    key={rel.name}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{rel.name}</span>
                    <Badge variant="outline" className="text-xs">Relationship</Badge>
                </div>
            ))}
        </div>
    );
}

function ComputedTable({ computed }: { computed: any[] }) {
    if (computed.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No computed attributes defined
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {computed.map((comp: any) => (
                <div
                    key={comp.name}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                    <Calculator className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">{comp.name}</span>
                    <Badge variant="outline" className="text-xs">Computed</Badge>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {comp.description}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ScopesTable({ scopes }: { scopes: any[] }) {
    if (scopes.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No query scopes defined
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {scopes.map((scope: any) => (
                <div
                    key={scope.name}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                    <Filter className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{scope.name}</span>
                    <Badge variant="outline" className="text-xs">Scope</Badge>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {scope.description}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ModelsTable({ models }: { models: any[] }) {
    if (models.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No models defined
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {models.map((model: any) => (
                <div
                    key={model.name}
                    className="p-4 bg-card border border-border rounded-lg"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Database className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">{model.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                            {model.table}
                        </Badge>
                        {model.isExtendable && (
                            <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                Extendable
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {model.fields.map((field: string) => (
                            <Badge key={field} variant="outline" className="text-xs font-mono">
                                {field}
                            </Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

const uiTypeIcons: Record<string, React.ReactNode> = {
    view: <Layout className="w-4 h-4 text-blue-500" />,
    widget: <FormInput className="w-4 h-4 text-green-500" />,
    extension: <Puzzle className="w-4 h-4 text-purple-500" />,
    layout: <PanelLeft className="w-4 h-4 text-orange-500" />,
    page: <FileCode className="w-4 h-4 text-pink-500" />,
    component: <Component className="w-4 h-4 text-cyan-500" />,
    hook: <Code className="w-4 h-4 text-yellow-500" />,
    slot: <Boxes className="w-4 h-4 text-indigo-500" />,
    extensionPoint: <Puzzle className="w-4 h-4 text-amber-500" />,
};

const uiTypeLabels: Record<string, string> = {
    views: 'Views',
    widgets: 'Widgets',
    extensions: 'Slot Extensions',
    layouts: 'Layout Components',
    pages: 'Pages',
    components: 'Components',
    hooks: 'Hooks',
    slots: 'Slot System',
    extensionPoints: 'Extension Points',
};

const uiTypeDescriptions: Record<string, string> = {
    views: 'Full-screen views that display data in different formats (e.g., list, kanban, calendar). Views are reusable ways to visualize records.',
    widgets: 'Small, reusable UI elements for forms and displays (e.g., date picker, currency input, status badge). Widgets handle specific field types.',
    extensions: 'Components that extend other modules by injecting content into extension points. They allow modules to add functionality to other modules.',
    layouts: 'Page structure components that define the overall layout of screens (e.g., sidebar layout, full-width layout).',
    pages: 'Route-based components that represent full pages in the application. Each page typically maps to a URL route.',
    components: 'Reusable UI building blocks specific to this module (e.g., contact card, invoice line editor). Components encapsulate module-specific functionality.',
    hooks: 'Custom React hooks that provide reusable logic and state management for the module (e.g., useContacts, useInvoiceCalculation).',
    slots: 'Named injection points where other modules can add content. Slots enable a plugin architecture for the UI.',
    extensionPoints: 'Declared slots where other modules can inject their components. Extension points define the contract for module extensibility.',
};

function UIComponentsSection({ ui }: { ui: Record<string, any[]> }) {
    if (!ui || Object.keys(ui).length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No UI components defined
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {Object.entries(ui).map(([category, components]) => (
                <div key={category} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            {uiTypeIcons[category.slice(0, -1)] || <Component className="w-4 h-4" />}
                            <h4 className="text-sm font-semibold">
                                {uiTypeLabels[category] || category}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                                {components.length}
                            </Badge>
                        </div>
                        {uiTypeDescriptions[category] && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {uiTypeDescriptions[category]}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        {components.map((comp: any, index: number) => (
                            <UIComponentCard key={`${comp.name}-${index}`} component={comp} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface PermissionGroup {
    id: string;
    name: string;
    description?: string;
    implied?: string[];
}

interface PermissionsData {
    groups?: PermissionGroup[];
    access?: Record<string, Record<string, boolean[]>>;
    rules?: Array<{
        id: string;
        name: string;
        model: string;
        domain: string;
        global?: boolean;
        groups?: string[];
        operations?: string[];
    }>;
}

function PermissionsSection({ permissions }: { permissions: PermissionsData }) {
    const groups = permissions.groups || [];
    const access = permissions.access || {};
    const rules = permissions.rules || [];

    const hasContent = groups.length > 0 || Object.keys(access).length > 0 || rules.length > 0;

    if (!hasContent) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No permissions defined for this module</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Permission Groups */}
            {groups.length > 0 && (
                <div>
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            Permission Groups
                            <Badge variant="secondary" className="text-xs">{groups.length}</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Groups define roles that users can be assigned to. Groups can inherit permissions from other groups via the "implied" relationship.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {groups.map((group) => (
                            <div key={group.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <code className="text-sm font-mono text-primary">{group.id}</code>
                                        </div>
                                        <p className="font-medium text-sm">{group.name}</p>
                                        {group.description && (
                                            <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
                                        )}
                                    </div>
                                    {group.implied && group.implied.length > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">Inherits from:</p>
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {group.implied.map((imp) => (
                                                    <Badge key={imp} variant="outline" className="text-xs font-mono">
                                                        {imp}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Access Control Lists */}
            {Object.keys(access).length > 0 && (
                <div>
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-green-500" />
                            Model Access Control (ACL)
                            <Badge variant="secondary" className="text-xs">{Object.keys(access).length}</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Defines which operations (Read, Write, Create, Delete) each group can perform on models.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Model</TableHead>
                                    <TableHead>Group</TableHead>
                                    <TableHead className="text-center w-[80px]">Read</TableHead>
                                    <TableHead className="text-center w-[80px]">Write</TableHead>
                                    <TableHead className="text-center w-[80px]">Create</TableHead>
                                    <TableHead className="text-center w-[80px]">Delete</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(access).map(([model, groupPerms]) => (
                                    Object.entries(groupPerms).map(([groupId, perms], index) => (
                                        <TableRow key={`${model}-${groupId}`}>
                                            {index === 0 && (
                                                <TableCell 
                                                    rowSpan={Object.keys(groupPerms).length}
                                                    className="font-mono text-sm align-top"
                                                >
                                                    {model}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{groupId}</code>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {perms[0] ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {perms[1] ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {perms[2] ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {perms[3] ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Record Rules */}
            {rules.length > 0 && (
                <div>
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-purple-500" />
                            Record Rules
                            <Badge variant="secondary" className="text-xs">{rules.length}</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Fine-grained rules that filter which specific records users can access. Rules use domain expressions to define conditions.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {rules.map((rule) => (
                            <div key={rule.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <code className="text-sm font-mono text-primary">{rule.id}</code>
                                        <p className="font-medium text-sm mt-1">{rule.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {rule.global && (
                                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                Global
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {rule.model}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Domain Expression:</p>
                                        <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                                            {typeof rule.domain === 'string' ? rule.domain : JSON.stringify(rule.domain)}
                                        </code>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        {rule.groups && rule.groups.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">Groups:</span>
                                                {rule.groups.map((g) => (
                                                    <Badge key={g} variant="outline" className="text-xs font-mono">
                                                        {g}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {rule.operations && rule.operations.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-muted-foreground">Operations:</span>
                                                {rule.operations.map((op) => (
                                                    <Badge key={op} variant="secondary" className="text-xs">
                                                        {op}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface ApiRoute {
    method: string;
    uri: string;
    name?: string;
    controller: string;
    action: string;
    authenticated: boolean;
    modelAccess?: string;
}

const methodColors: Record<string, string> = {
    'GET': 'bg-green-500/10 text-green-600 border-green-500/30',
    'POST': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    'PUT': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    'PATCH': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    'DELETE': 'bg-red-500/10 text-red-600 border-red-500/30',
    'HEAD': 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

function ApiRoutesSection({ routes }: { routes: ApiRoute[] }) {
    if (!routes || routes.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No API routes defined for this module</p>
            </div>
        );
    }

    // Group routes by controller
    const groupedRoutes = routes.reduce((acc, route) => {
        const controller = route.controller;
        if (!acc[controller]) {
            acc[controller] = [];
        }
        acc[controller].push(route);
        return acc;
    }, {} as Record<string, ApiRoute[]>);

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    REST API endpoints exposed by this module. All endpoints require authentication unless otherwise noted.
                </p>
            </div>

            {Object.entries(groupedRoutes).map(([controller, controllerRoutes]) => (
                <div key={controller} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 px-4 py-3 border-b border-border">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            {controller}
                            <Badge variant="secondary" className="text-xs ml-2">
                                {controllerRoutes.length} endpoints
                            </Badge>
                        </h4>
                    </div>
                    <div className="divide-y divide-border">
                        {controllerRoutes.map((route, index) => {
                            const methods = route.method.split('|').filter(m => m !== 'HEAD');
                            return (
                                <div key={index} className="p-4 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {methods.map((method) => (
                                                    <Badge 
                                                        key={method} 
                                                        className={`text-xs font-mono ${methodColors[method] || 'bg-gray-500/10 text-gray-600'}`}
                                                    >
                                                        {method}
                                                    </Badge>
                                                ))}
                                                <code className="text-sm font-mono text-foreground">
                                                    {route.uri}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Action:</span>
                                                    <code className="bg-muted px-1.5 py-0.5 rounded">{route.action}</code>
                                                </span>
                                                {route.name && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-muted-foreground">Name:</span>
                                                        <code className="bg-muted px-1.5 py-0.5 rounded">{route.name}</code>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {route.authenticated ? (
                                                <Badge variant="outline" className="text-xs">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Auth
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                                    Public
                                                </Badge>
                                            )}
                                            {route.modelAccess && (
                                                <Badge className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                                                    <Database className="w-3 h-3 mr-1" />
                                                    {route.modelAccess}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Summary */}
            <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total endpoints:</span>
                    <strong>{routes.length}</strong>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Controllers:</span>
                    <strong>{Object.keys(groupedRoutes).length}</strong>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Protected:</span>
                    <strong>{routes.filter(r => r.authenticated).length}</strong>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">With ACL:</span>
                    <strong>{routes.filter(r => r.modelAccess).length}</strong>
                </div>
            </div>
        </div>
    );
}

function TestsSection({ tests }: { tests: any }) {
    if (!tests || (tests.suites?.length === 0 && tests.files?.length === 0)) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <TestTube2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tests defined for this module</p>
                <p className="text-sm mt-1">Add tests in modules/[name]/tests/*.spec.ts</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Test Summary */}
            <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                        <strong>{tests.files?.length || 0}</strong> test files
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <TestTube2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                        <strong>{tests.totalTests || 0}</strong> total tests
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                        <strong>{tests.suites?.length || 0}</strong> test suites
                    </span>
                </div>
            </div>

            {/* Coverage */}
            {tests.coverage && (tests.coverage.pages?.length > 0 || tests.coverage.features?.length > 0) && (
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Coverage</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {tests.coverage.pages?.length > 0 && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Pages Covered</p>
                                <div className="flex flex-wrap gap-1">
                                    {tests.coverage.pages.map((page: string) => (
                                        <Badge key={page} variant="outline" className="text-xs font-mono">
                                            {page}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {tests.coverage.features?.length > 0 && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Features Tested</p>
                                <div className="flex flex-wrap gap-1">
                                    {tests.coverage.features.map((feature: string) => (
                                        <Badge key={feature} variant="secondary" className="text-xs">
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Test Suites */}
            {tests.suites && tests.suites.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Test Suites</h4>
                    <div className="space-y-3">
                        {tests.suites.map((suite: any, index: number) => (
                            <TestSuiteCard key={`${suite.name}-${index}`} suite={suite} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TestSuiteCard({ suite }: { suite: { name: string; tests: string[] } }) {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <TestTube2 className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{suite.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {suite.tests?.length || 0} tests
                    </Badge>
                    <ChevronLeft className={`w-4 h-4 transition-transform ${expanded ? '-rotate-90' : ''}`} />
                </div>
            </button>
            
            {expanded && suite.tests && suite.tests.length > 0 && (
                <div className="border-t border-border p-3 bg-muted/30">
                    <div className="space-y-1">
                        {suite.tests.map((test: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 text-sm py-1"
                            >
                                <Circle className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{test}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function UIComponentCard({ component }: { component: any }) {
    return (
        <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    {uiTypeIcons[component.type] || <Component className="w-4 h-4" />}
                    <span className="font-medium">{component.name}</span>
                    {component.subdir && (
                        <Badge variant="outline" className="text-xs">
                            {component.subdir}
                        </Badge>
                    )}
                    {component.isFormView && (
                        <Badge className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                            Form View
                        </Badge>
                    )}
                    {component.usesWidgets && (
                        <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            Uses Widgets
                        </Badge>
                    )}
                </div>
            </div>

            {/* Exports */}
            {component.exports && component.exports.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Exports:</span>
                    {component.exports.map((exp: string) => (
                        <Badge key={exp} variant="outline" className="text-xs font-mono">
                            {exp}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Registrations */}
            {component.registrations && component.registrations.length > 0 && (
                <div className="mt-2 space-y-1">
                    {component.registrations.map((reg: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            {reg.type === 'widget' && (
                                <>
                                    <FormInput className="w-3 h-3 text-green-500" />
                                    <span className="text-muted-foreground">Registers widget:</span>
                                    <code className="bg-green-500/10 text-green-700 px-1 rounded">
                                        {reg.name}
                                    </code>
                                </>
                            )}
                            {reg.type === 'view' && (
                                <>
                                    <Layout className="w-3 h-3 text-blue-500" />
                                    <span className="text-muted-foreground">Registers view:</span>
                                    <code className="bg-blue-500/10 text-blue-700 px-1 rounded">
                                        {reg.id}
                                    </code>
                                </>
                            )}
                            {reg.type === 'slot' && (
                                <>
                                    <Puzzle className="w-3 h-3 text-purple-500" />
                                    <span className="text-muted-foreground">Extends:</span>
                                    <code className="bg-purple-500/10 text-purple-700 px-1 rounded">
                                        {reg.view}
                                    </code>
                                    <span className="text-muted-foreground">slot:</span>
                                    <code className="bg-purple-500/10 text-purple-700 px-1 rounded">
                                        {reg.slot}
                                    </code>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Slots defined */}
            {component.slots && component.slots.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Defines slots:</span>
                    {component.slots.map((slot: string) => (
                        <Badge key={slot} variant="secondary" className="text-xs font-mono">
                            {slot}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
        </div>
    );
}

// Trust level configuration for plugins
const trustLevelConfig = {
    community: {
        label: 'Community',
        icon: Users,
        color: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    verified: {
        label: 'Verified',
        icon: ShieldCheck,
        color: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    certified: {
        label: 'Certified',
        icon: Shield,
        color: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    core: {
        label: 'Core',
        icon: Star,
        color: 'bg-amber-100 text-amber-700 border-amber-300',
    },
};

function PluginsSection({ moduleId }: { moduleId: string }) {
    const { data: plugins, isLoading, error } = useModulePlugins(moduleId);
    const [activePlugins, setActivePlugins] = useState<Record<string, boolean>>({});

    const togglePlugin = (pluginId: string) => {
        setActivePlugins(prev => ({
            ...prev,
            [pluginId]: !prev[pluginId]
        }));
        // TODO: Call API to persist plugin activation state
    };

    const isPluginActive = (pluginId: string) => activePlugins[pluginId] || false;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive opacity-50" />
                <p>Failed to load plugins</p>
            </div>
        );
    }

    if (!plugins || plugins.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Plug className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No plugins extend this module</p>
                <p className="text-sm mt-2">
                    Plugins can add custom fields, UI components, and integrations to modules.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {plugins.length} plugin{plugins.length !== 1 ? 's' : ''} extend{plugins.length === 1 ? 's' : ''} this module
                </p>
            </div>

            <div className="grid gap-4">
                {plugins.map((plugin) => {
                    const trustConfig = trustLevelConfig[plugin.trustLevel] || trustLevelConfig.community;
                    const TrustIcon = trustConfig.icon;

                    return (
                        <div
                            key={plugin.id}
                            className="p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${trustConfig.color}`}>
                                        <Plug className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{plugin.name}</h4>
                                            <Badge variant="outline" className="text-xs">v{plugin.version}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {plugin.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={trustConfig.color}>
                                        <TrustIcon className="h-3 w-3 mr-1" />
                                        {trustConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className={plugin.scope === 'global' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'}>
                                        {plugin.scope === 'global' ? (
                                            <><Globe className="h-3 w-3 mr-1" /> Global</>
                                        ) : (
                                            <><Building2 className="h-3 w-3 mr-1" /> Tenant</>
                                        )}
                                    </Badge>
                                    <div className="flex items-center gap-2 border-l border-border pl-3">
                                        <span className={`text-xs font-medium ${isPluginActive(plugin.id) ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {isPluginActive(plugin.id) ? 'Active' : 'Inactive'}
                                        </span>
                                        <Switch
                                            checked={isPluginActive(plugin.id)}
                                            onCheckedChange={() => togglePlugin(plugin.id)}
                                            className="data-[state=checked]:bg-green-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Plugin details */}
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    {/* Slots */}
                                    <div>
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            UI Slots ({plugin.slots?.length || 0})
                                        </p>
                                        {plugin.slots && plugin.slots.length > 0 ? (
                                            <div className="space-y-1">
                                                {plugin.slots.slice(0, 3).map((slot, i) => (
                                                    <code key={i} className="block text-xs bg-muted px-2 py-1 rounded truncate">
                                                        {slot.slot}
                                                    </code>
                                                ))}
                                                {plugin.slots.length > 3 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{plugin.slots.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </div>

                                    {/* Fields */}
                                    <div>
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1">
                                            <Database className="w-3 h-3" />
                                            Custom Fields ({plugin.fields?.length || 0})
                                        </p>
                                        {plugin.fields && plugin.fields.length > 0 ? (
                                            <div className="space-y-1">
                                                {plugin.fields.slice(0, 3).map((field, i) => (
                                                    <div key={i} className="text-xs">
                                                        <code className="bg-muted px-1 rounded">{field.name}</code>
                                                        <span className="text-muted-foreground ml-1">({field.type})</span>
                                                    </div>
                                                ))}
                                                {plugin.fields.length > 3 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{plugin.fields.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </div>

                                    {/* Capabilities */}
                                    <div>
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Capabilities ({plugin.capabilities?.length || 0})
                                        </p>
                                        {plugin.capabilities && plugin.capabilities.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {plugin.capabilities.slice(0, 4).map((cap, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {cap.replace('ui.', '').replace('api.', '').replace('fields.', '')}
                                                    </Badge>
                                                ))}
                                                {plugin.capabilities.length > 4 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{plugin.capabilities.length - 4}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Validation errors */}
                            {!plugin.isValid && plugin.errors && Object.keys(plugin.errors).length > 0 && (
                                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Validation Errors
                                    </div>
                                    {Object.entries(plugin.errors).map(([field, error]) => (
                                        <p key={field} className="text-xs text-destructive">
                                            <strong>{field}:</strong> {error}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Author */}
                            <div className="mt-3 text-xs text-muted-foreground">
                                by {plugin.author}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Page template configurations for UI map visualization
interface PageLayout {
    id: string;
    path: string;
    title: string;
    component?: string;
    template: 'list' | 'detail' | 'form' | 'generic';
    layout: {
        regions: Record<string, {
            title?: string;
            description?: string;
            subtitle?: string;
            hasSearch?: boolean;
            hasFilters?: boolean;
            hasPagination?: boolean;
            hasBackButton?: boolean;
            items?: string[];
            columns?: string[];
            fields?: string[];
            buttons?: string[];
            sections?: Array<{
                id: string;
                title: string;
                fields?: string[];
                slots?: string[];
            }>;
            slots?: string[];
        }>;
    };
}

interface SlotInfo {
    id: string;
    description: string;
    region: string;
    pluginCount?: number;
    plugins?: string[];
}

// Slot visualization component
function SlotZone({ 
    slot, 
    plugins,
    isHighlighted,
    onClick 
}: { 
    slot: SlotInfo; 
    plugins: string[];
    isHighlighted: boolean;
    onClick: () => void;
}) {
    const hasPlugins = plugins.length > 0;
    
    return (
        <div
            onClick={onClick}
            className={`
                relative border-2 border-dashed rounded-lg p-3 cursor-pointer transition-all
                ${isHighlighted 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : hasPlugins 
                        ? 'border-green-500 bg-green-500/5 hover:bg-green-500/10' 
                        : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted/50'
                }
            `}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Puzzle className={`w-4 h-4 ${hasPlugins ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <code className="text-xs font-mono">{slot.id}</code>
                </div>
                {hasPlugins && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {plugins.length} plugin{plugins.length !== 1 ? 's' : ''}
                    </Badge>
                )}
            </div>
            {slot.description && (
                <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
            )}
            {isHighlighted && plugins.length > 0 && (
                <div className="mt-2 pt-2 border-t border-primary/20">
                    <p className="text-xs font-medium mb-1">Active plugins:</p>
                    {plugins.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">
                            {p}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

// List page mockup
function ListPageMockup({ 
    page, 
    slots, 
    pluginsBySlot, 
    highlightedSlot, 
    onSlotClick 
}: { 
    page: PageLayout; 
    slots: SlotInfo[];
    pluginsBySlot: Record<string, string[]>;
    highlightedSlot: string | null;
    onSlotClick: (slotId: string) => void;
}) {
    const layout = page.layout.regions;
    const getSlotInfo = (slotId: string) => slots.find(s => s.id === slotId);
    const getPlugins = (slotId: string) => pluginsBySlot[slotId] || [];

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-background">
            {/* Header */}
            <div className="bg-muted/30 border-b border-border p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">{layout.header?.title || page.title}</h3>
                        {layout.header?.description && (
                            <p className="text-sm text-muted-foreground">{layout.header.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-8 bg-primary/20 rounded flex items-center justify-center text-xs">
                            + New
                        </div>
                    </div>
                </div>
                {/* Header slots */}
                {layout.header?.slots?.map(slotId => {
                    const slotInfo = getSlotInfo(slotId);
                    if (!slotInfo) return null;
                    return (
                        <div key={slotId} className="mt-3">
                            <SlotZone 
                                slot={slotInfo} 
                                plugins={getPlugins(slotId)}
                                isHighlighted={highlightedSlot === slotId}
                                onClick={() => onSlotClick(slotId)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            {layout.toolbar && (
                <div className="border-b border-border p-3 bg-muted/10">
                    <div className="flex items-center gap-3">
                        {layout.toolbar.hasSearch && (
                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 flex-1 max-w-xs">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Search...</span>
                            </div>
                        )}
                        {layout.toolbar.hasFilters && (
                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Filters</span>
                            </div>
                        )}
                        {/* Toolbar slots */}
                        {layout.toolbar.slots?.map(slotId => {
                            const slotInfo = getSlotInfo(slotId);
                            if (!slotInfo) return null;
                            return (
                                <SlotZone 
                                    key={slotId}
                                    slot={slotInfo} 
                                    plugins={getPlugins(slotId)}
                                    isHighlighted={highlightedSlot === slotId}
                                    onClick={() => onSlotClick(slotId)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats */}
            {layout.stats && (
                <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-4 gap-3">
                        {layout.stats.items?.map((item, i) => (
                            <div key={i} className="bg-muted/30 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-muted-foreground/50">--</div>
                                <div className="text-xs text-muted-foreground">{item}</div>
                            </div>
                        ))}
                    </div>
                    {/* Stats slots */}
                    {layout.stats.slots?.map(slotId => {
                        const slotInfo = getSlotInfo(slotId);
                        if (!slotInfo) return null;
                        return (
                            <div key={slotId} className="mt-3">
                                <SlotZone 
                                    slot={slotInfo} 
                                    plugins={getPlugins(slotId)}
                                    isHighlighted={highlightedSlot === slotId}
                                    onClick={() => onSlotClick(slotId)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table */}
            {layout.table && (
                <div className="p-4">
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted/30">
                            <div className="flex items-center border-b border-border">
                                {layout.table.columns?.map((col, i) => (
                                    <div key={i} className="flex-1 px-4 py-2 text-xs font-medium text-muted-foreground">
                                        {col}
                                    </div>
                                ))}
                                <div className="w-20 px-4 py-2 text-xs font-medium text-muted-foreground text-center">
                                    Actions
                                </div>
                            </div>
                        </div>
                        {/* Sample rows */}
                        {[1, 2, 3].map(row => (
                            <div key={row} className="flex items-center border-b border-border last:border-0">
                                {layout.table.columns?.map((_, i) => (
                                    <div key={i} className="flex-1 px-4 py-3">
                                        <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                                    </div>
                                ))}
                                <div className="w-20 px-4 py-3 flex justify-center">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Table slots */}
                    <div className="flex gap-3 mt-3">
                        {layout.table.slots?.map(slotId => {
                            const slotInfo = getSlotInfo(slotId);
                            if (!slotInfo) return null;
                            return (
                                <div key={slotId} className="flex-1">
                                    <SlotZone 
                                        slot={slotInfo} 
                                        plugins={getPlugins(slotId)}
                                        isHighlighted={highlightedSlot === slotId}
                                        onClick={() => onSlotClick(slotId)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Footer/Pagination */}
            {layout.footer?.hasPagination && (
                <div className="border-t border-border p-3 bg-muted/10">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing 1-10 of 50</span>
                        <div className="flex gap-1">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">«</div>
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center">1</div>
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">2</div>
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">»</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Detail page mockup
function DetailPageMockup({ 
    page, 
    slots, 
    pluginsBySlot, 
    highlightedSlot, 
    onSlotClick 
}: { 
    page: PageLayout; 
    slots: SlotInfo[];
    pluginsBySlot: Record<string, string[]>;
    highlightedSlot: string | null;
    onSlotClick: (slotId: string) => void;
}) {
    const layout = page.layout.regions;
    const getSlotInfo = (slotId: string) => slots.find(s => s.id === slotId);
    const getPlugins = (slotId: string) => pluginsBySlot[slotId] || [];

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-background">
            {/* Header */}
            <div className="bg-muted/30 border-b border-border p-4">
                <div className="flex items-center gap-3">
                    {layout.header?.hasBackButton && (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-semibold">{layout.header?.title || page.title}</h3>
                        {layout.header?.subtitle && (
                            <p className="text-sm text-muted-foreground">{layout.header.subtitle}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-muted rounded text-sm">Edit</div>
                        <div className="px-3 py-1.5 bg-primary/20 rounded text-sm">Actions</div>
                    </div>
                </div>
                {/* Header slots */}
                {layout.header?.slots?.map(slotId => {
                    const slotInfo = getSlotInfo(slotId);
                    if (!slotInfo) return null;
                    return (
                        <div key={slotId} className="mt-3">
                            <SlotZone 
                                slot={slotInfo} 
                                plugins={getPlugins(slotId)}
                                isHighlighted={highlightedSlot === slotId}
                                onClick={() => onSlotClick(slotId)}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="flex">
                {/* Main content */}
                <div className="flex-1 p-4 border-r border-border">
                    {/* Sections */}
                    {layout.main?.sections?.map((section, i) => (
                        <div key={section.id} className={`${i > 0 ? 'mt-6 pt-6 border-t border-border' : ''}`}>
                            <h4 className="font-medium mb-3">{section.title}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {section.fields?.map((field, fi) => (
                                    <div key={fi}>
                                        <div className="text-xs text-muted-foreground mb-1">{field}</div>
                                        <div className="h-5 bg-muted/50 rounded w-3/4"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Section slots */}
                            {section.slots?.map(slotId => {
                                const slotInfo = getSlotInfo(slotId);
                                if (!slotInfo) return null;
                                return (
                                    <div key={slotId} className="mt-3">
                                        <SlotZone 
                                            slot={slotInfo} 
                                            plugins={getPlugins(slotId)}
                                            isHighlighted={highlightedSlot === slotId}
                                            onClick={() => onSlotClick(slotId)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Tabs section */}
                    {layout.tabs && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <div className="flex items-center gap-1 border-b border-border">
                                {layout.tabs.items?.map((tab, i) => (
                                    <div 
                                        key={i} 
                                        className={`px-4 py-2 text-sm ${i === 0 ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                                    >
                                        {tab}
                                    </div>
                                ))}
                                {/* Tabs slot indicator */}
                                {layout.tabs.slots?.map(slotId => {
                                    const slotInfo = getSlotInfo(slotId);
                                    if (!slotInfo) return null;
                                    const plugins = getPlugins(slotId);
                                    return (
                                        <div
                                            key={slotId}
                                            onClick={() => onSlotClick(slotId)}
                                            className={`
                                                px-4 py-2 text-sm border-2 border-dashed rounded-t cursor-pointer
                                                ${highlightedSlot === slotId 
                                                    ? 'border-primary bg-primary/10' 
                                                    : plugins.length > 0 
                                                        ? 'border-green-500 bg-green-500/5' 
                                                        : 'border-muted-foreground/30'
                                                }
                                            `}
                                        >
                                            <Plus className="w-4 h-4 inline mr-1" />
                                            {plugins.length > 0 ? `${plugins.length} tabs` : 'Plugin tabs'}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 bg-muted/10 rounded-b-lg min-h-[100px]">
                                <p className="text-sm text-muted-foreground">Tab content area</p>
                                {/* Tab content slots */}
                                {layout.tabContent?.slots?.map(slotId => {
                                    const slotInfo = getSlotInfo(slotId);
                                    if (!slotInfo) return null;
                                    return (
                                        <div key={slotId} className="mt-3">
                                            <SlotZone 
                                                slot={slotInfo} 
                                                plugins={getPlugins(slotId)}
                                                isHighlighted={highlightedSlot === slotId}
                                                onClick={() => onSlotClick(slotId)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Below tabs slots */}
                    {layout.belowTabs?.slots?.map(slotId => {
                        const slotInfo = getSlotInfo(slotId);
                        if (!slotInfo) return null;
                        return (
                            <div key={slotId} className="mt-4">
                                <SlotZone 
                                    slot={slotInfo} 
                                    plugins={getPlugins(slotId)}
                                    isHighlighted={highlightedSlot === slotId}
                                    onClick={() => onSlotClick(slotId)}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar */}
                {layout.sidebar && (
                    <div className="w-80 p-4 bg-muted/10">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Sidebar</h4>
                        {/* Sidebar slots */}
                        {layout.sidebar.slots?.map(slotId => {
                            const slotInfo = getSlotInfo(slotId);
                            if (!slotInfo) return null;
                            return (
                                <div key={slotId} className="mb-3">
                                    <SlotZone 
                                        slot={slotInfo} 
                                        plugins={getPlugins(slotId)}
                                        isHighlighted={highlightedSlot === slotId}
                                        onClick={() => onSlotClick(slotId)}
                                    />
                                </div>
                            );
                        })}
                        {layout.sidebar.slots?.length === 0 && (
                            <div className="text-sm text-muted-foreground">No sidebar slots</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Form page mockup
function FormPageMockup({ 
    page, 
    slots, 
    pluginsBySlot, 
    highlightedSlot, 
    onSlotClick 
}: { 
    page: PageLayout; 
    slots: SlotInfo[];
    pluginsBySlot: Record<string, string[]>;
    highlightedSlot: string | null;
    onSlotClick: (slotId: string) => void;
}) {
    const layout = page.layout.regions;
    const getSlotInfo = (slotId: string) => slots.find(s => s.id === slotId);
    const getPlugins = (slotId: string) => pluginsBySlot[slotId] || [];

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-background">
            {/* Header */}
            <div className="bg-muted/30 border-b border-border p-4">
                <div className="flex items-center gap-3">
                    {layout.header?.hasBackButton && (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                    )}
                    <h3 className="font-semibold flex-1">{layout.header?.title || page.title}</h3>
                </div>
            </div>

            <div className="flex">
                {/* Form content */}
                <div className="flex-1 p-6">
                    {layout.form?.sections?.map((section, i) => (
                        <div key={section.id} className={`${i > 0 ? 'mt-8' : ''}`}>
                            <h4 className="font-medium mb-4 pb-2 border-b border-border">{section.title}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {section.fields?.map((field, fi) => (
                                    <div key={fi}>
                                        <label className="text-sm font-medium mb-1 block">{field}</label>
                                        <div className="h-10 bg-muted/30 border border-border rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Section slots */}
                            {section.slots?.map(slotId => {
                                const slotInfo = getSlotInfo(slotId);
                                if (!slotInfo) return null;
                                return (
                                    <div key={slotId} className="mt-4">
                                        <SlotZone 
                                            slot={slotInfo} 
                                            plugins={getPlugins(slotId)}
                                            isHighlighted={highlightedSlot === slotId}
                                            onClick={() => onSlotClick(slotId)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Sidebar */}
                {layout.sidebar?.slots && layout.sidebar.slots.length > 0 && (
                    <div className="w-80 p-4 bg-muted/10 border-l border-border">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Sidebar</h4>
                        {layout.sidebar.slots.map(slotId => {
                            const slotInfo = getSlotInfo(slotId);
                            if (!slotInfo) return null;
                            return (
                                <div key={slotId} className="mb-3">
                                    <SlotZone 
                                        slot={slotInfo} 
                                        plugins={getPlugins(slotId)}
                                        isHighlighted={highlightedSlot === slotId}
                                        onClick={() => onSlotClick(slotId)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Actions */}
            {layout.actions && (
                <div className="border-t border-border p-4 bg-muted/10">
                    <div className="flex items-center justify-end gap-3">
                        {layout.actions.buttons?.map((btn, i) => (
                            <div 
                                key={i} 
                                className={`px-4 py-2 rounded ${i === layout.actions!.buttons!.length - 1 ? 'bg-primary/20' : 'bg-muted'}`}
                            >
                                {btn}
                            </div>
                        ))}
                        {/* Action slots */}
                        {layout.actions.slots?.map(slotId => {
                            const slotInfo = getSlotInfo(slotId);
                            if (!slotInfo) return null;
                            return (
                                <SlotZone 
                                    key={slotId}
                                    slot={slotInfo} 
                                    plugins={getPlugins(slotId)}
                                    isHighlighted={highlightedSlot === slotId}
                                    onClick={() => onSlotClick(slotId)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function UIMapSection({ module, moduleId }: { module: any; moduleId: string }) {
    const [selectedPage, setSelectedPage] = useState<string | null>(null);
    const [highlightedSlot, setHighlightedSlot] = useState<string | null>(null);
    const { data: plugins } = useModulePlugins(moduleId);

    // Extract pages and slots from manifest
    const pages: PageLayout[] = module.frontend?.pages || [];
    const slots: SlotInfo[] = (module.frontend?.slots || []).map((s: any) => ({
        id: s.id,
        description: s.description,
        region: s.region,
    }));

    // Build pluginsBySlot mapping
    const pluginsBySlot: Record<string, string[]> = {};
    if (plugins) {
        for (const plugin of plugins) {
            for (const slot of (plugin.slots || [])) {
                if (!pluginsBySlot[slot.slot]) {
                    pluginsBySlot[slot.slot] = [];
                }
                pluginsBySlot[slot.slot].push(plugin.name);
            }
        }
    }

    // Auto-select first page
    const activePage = selectedPage || (pages.length > 0 ? pages[0].id : null);
    const currentPage = pages.find(p => p.id === activePage);

    if (pages.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Map className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No page layouts defined for this module</p>
                <p className="text-sm mt-2">
                    Add page layout definitions to the module manifest to visualize available slots.
                </p>
            </div>
        );
    }

    const handleSlotClick = (slotId: string) => {
        setHighlightedSlot(highlightedSlot === slotId ? null : slotId);
    };

    // Get UI components from module
    const uiComponents = module.ui || {};
    const totalComponents = Object.values(uiComponents).flat().length;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{pages.length}</p>
                    <p className="text-xs text-muted-foreground">Pages</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{slots.length}</p>
                    <p className="text-xs text-muted-foreground">Slots</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{Object.keys(pluginsBySlot).length}</p>
                    <p className="text-xs text-muted-foreground">Active Slots</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{totalComponents}</p>
                    <p className="text-xs text-muted-foreground">Components</p>
                </div>
            </div>

            {/* Components Overview (if any) */}
            {totalComponents > 0 && (
                <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Component className="w-4 h-4" />
                        UI Components
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(uiComponents).map(([type, components]) => {
                            const comps = components as any[];
                            if (!comps || comps.length === 0) return null;
                            return (
                                <div key={type} className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground capitalize mb-1">{type}</p>
                                    <p className="font-semibold">{comps.length}</p>
                                    <div className="mt-2 space-y-1">
                                        {comps.slice(0, 3).map((comp, i) => (
                                            <p key={i} className="text-xs truncate text-muted-foreground">
                                                {comp.name}
                                            </p>
                                        ))}
                                        {comps.length > 3 && (
                                            <p className="text-xs text-muted-foreground">+{comps.length - 3} more</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Intro */}
            <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <MousePointer className="w-5 h-5 text-primary mt-0.5" />
                <div>
                    <p className="text-sm">
                        Click on any <span className="font-medium text-primary">slot zone</span> to see details and which plugins are using it.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border-2 border-dashed border-green-500 rounded"></span> Green = has plugins</span>
                        <span className="inline-flex items-center gap-1 ml-4"><span className="w-3 h-3 border-2 border-dashed border-muted-foreground/30 rounded"></span> Gray = available</span>
                    </p>
                </div>
            </div>

            {/* Page selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page:</span>
                <div className="flex gap-2">
                    {pages.map(page => (
                        <Button
                            key={page.id}
                            variant={activePage === page.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                setSelectedPage(page.id);
                                setHighlightedSlot(null);
                            }}
                        >
                            {page.template === 'list' && <List className="w-4 h-4 mr-1" />}
                            {page.template === 'detail' && <FileText className="w-4 h-4 mr-1" />}
                            {page.template === 'form' && <FormInput className="w-4 h-4 mr-1" />}
                            {page.title}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Page mockup */}
            {currentPage && (
                <div>
                    {currentPage.template === 'list' && (
                        <ListPageMockup 
                            page={currentPage} 
                            slots={slots}
                            pluginsBySlot={pluginsBySlot}
                            highlightedSlot={highlightedSlot}
                            onSlotClick={handleSlotClick}
                        />
                    )}
                    {currentPage.template === 'detail' && (
                        <DetailPageMockup 
                            page={currentPage} 
                            slots={slots}
                            pluginsBySlot={pluginsBySlot}
                            highlightedSlot={highlightedSlot}
                            onSlotClick={handleSlotClick}
                        />
                    )}
                    {currentPage.template === 'form' && (
                        <FormPageMockup 
                            page={currentPage} 
                            slots={slots}
                            pluginsBySlot={pluginsBySlot}
                            highlightedSlot={highlightedSlot}
                            onSlotClick={handleSlotClick}
                        />
                    )}
                    {(currentPage.template === 'generic' || !['list', 'detail', 'form'].includes(currentPage.template)) && (
                        <div className="border border-border rounded-xl p-8 bg-muted/10 text-center">
                            <div className="text-muted-foreground mb-4">
                                <FileText className="w-12 h-12 mx-auto opacity-50" />
                            </div>
                            <p className="text-lg font-medium">{currentPage.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{currentPage.path}</p>
                            <p className="text-xs text-muted-foreground mt-4">
                                No visual mockup available for "{currentPage.template}" template
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Slot legend */}
            <div className="border border-border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    All Slots ({slots.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {slots.map(slot => {
                        const plugins = pluginsBySlot[slot.id] || [];
                        return (
                            <div 
                                key={slot.id}
                                onClick={() => handleSlotClick(slot.id)}
                                className={`
                                    p-2 rounded-lg cursor-pointer transition-colors text-sm
                                    ${highlightedSlot === slot.id 
                                        ? 'bg-primary/10 border border-primary' 
                                        : 'bg-muted/30 hover:bg-muted/50'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <code className="text-xs font-mono">{slot.id}</code>
                                    {plugins.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {plugins.length}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function ModuleDetail() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const { data: module, isLoading, error, refetch } = useModuleDetail(moduleId || '');

    if (error) {
        return (
            <DashboardLayout>
                <DashboardHeader title="Module Details" subtitle="View module information" />
                <div className="p-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                        <p className="text-destructive font-medium">Failed to load module</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            The module may not exist or you may not have permission to view it.
                        </p>
                        <div className="flex gap-2 justify-center mt-4">
                            <Link to="/my-modules">
                                <Button variant="outline">
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Back to Modules
                                </Button>
                            </Link>
                            <Button onClick={() => refetch()}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader 
                title={module?.name || 'Module Details'} 
                subtitle={module?.description || 'Loading...'} 
            />
            <div className="p-6">
                {/* Back button */}
                <Link to="/my-modules">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Modules
                    </Button>
                </Link>

                {isLoading ? (
                    <LoadingSkeleton />
                ) : module ? (
                    <div className="space-y-6">
                        {/* Module Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-card border border-border rounded-xl"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{module.name}</h2>
                                        <p className="text-muted-foreground mt-1">{module.description}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                                                {module.status}
                                            </Badge>
                                            <Badge variant="outline">v{module.version}</Badge>
                                            <Badge variant="outline">{module.category}</Badge>
                                            <Badge variant="outline">{module.license}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Author</p>
                                    <p className="font-medium">{module.author}</p>
                                </div>
                            </div>

                            {/* Dependencies */}
                            {module.depends && module.depends.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Dependencies</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {module.depends.map((dep: string) => (
                                            <Link key={dep} to={`/modules/${dep}`}>
                                                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                    {dep}
                                                    <ExternalLink className="w-3 h-3 ml-1" />
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Module Content Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-xl overflow-hidden"
                        >
                            <Tabs defaultValue="overview" className="w-full">
                                <div className="border-b border-border bg-muted/30 px-6">
                                    <TabsList className="h-14 bg-transparent p-0 w-full justify-start gap-0">
                                        <TabsTrigger 
                                            value="overview" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Package className="w-4 h-4 mr-2" />
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="models" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Database className="w-4 h-4 mr-2" />
                                            Models
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {(module.models || []).length}
                                            </Badge>
                                        </TabsTrigger>

                                        <TabsTrigger 
                                            value="permissions" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Shield className="w-4 h-4 mr-2" />
                                            Permissions
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {(module.permissions?.groups || []).length + Object.keys(module.permissions?.access || {}).length}
                                            </Badge>
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="plugins" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Plug className="w-4 h-4 mr-2" />
                                            Plugins
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="ui-map" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Layers className="w-4 h-4 mr-2" />
                                            UI Map
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="tests" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <TestTube2 className="w-4 h-4 mr-2" />
                                            Tests
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {module.tests?.totalTests || 0}
                                            </Badge>
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="api" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Code className="w-4 h-4 mr-2" />
                                            API
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {(module.api || []).length}
                                            </Badge>
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="settings" 
                                            className="h-14 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Settings
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {Object.keys(module.settings || {}).length}
                                            </Badge>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="p-6 m-0">
                                    <div className="space-y-6">
                                        {/* Quick Stats */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Quick Stats</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Database className="w-4 h-4" />
                                                        <span className="text-xs">Models</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{(module.models || []).length}</p>
                                                </div>
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Code className="w-4 h-4" />
                                                        <span className="text-xs">API Endpoints</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{(module.api || []).length}</p>
                                                </div>
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Layers className="w-4 h-4" />
                                                        <span className="text-xs">Slots</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{(module.frontend?.slots || []).length}</p>
                                                </div>
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Shield className="w-4 h-4" />
                                                        <span className="text-xs">Permissions</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{(module.permissions?.groups || []).length}</p>
                                                </div>
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Puzzle className="w-4 h-4" />
                                                        <span className="text-xs">Extensions</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{Object.keys(module.extensions || {}).length}</p>
                                                </div>
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <TestTube2 className="w-4 h-4" />
                                                        <span className="text-xs">Tests</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{module.tests?.totalTests || 0}</p>
                                                </div>
                                                <div className="p-4 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Settings className="w-4 h-4" />
                                                        <span className="text-xs">Settings</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{Object.keys(module.settings || {}).length}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Module Info */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Module Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between py-2 border-b border-border">
                                                        <span className="text-muted-foreground">Version</span>
                                                        <span className="font-mono">v{module.version}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-border">
                                                        <span className="text-muted-foreground">Category</span>
                                                        <Badge variant="outline">{module.category}</Badge>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-border">
                                                        <span className="text-muted-foreground">Author</span>
                                                        <span>{module.author}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-border">
                                                        <span className="text-muted-foreground">License</span>
                                                        <span>{module.license}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-muted-foreground">Status</span>
                                                        <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                                                            {module.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Dependencies</h3>
                                                {module.depends && module.depends.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {module.depends.map((dep: string) => (
                                                            <Link key={dep} to={`/modules/${dep}`} className="block">
                                                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                                                    <div className="flex items-center gap-2">
                                                                        <Package className="w-4 h-4 text-muted-foreground" />
                                                                        <span className="font-medium">{dep}</span>
                                                                    </div>
                                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-muted-foreground text-sm">No dependencies</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Models Tab */}
                                <TabsContent value="models" className="p-6 m-0">
                                    {module.models && module.models.length > 0 ? (
                                        <ModelsTable models={module.models} />
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                            <p>No models defined in this module</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Permissions Tab */}
                                <TabsContent value="permissions" className="p-6 m-0">
                                    <PermissionsSection permissions={module.permissions || {}} />
                                </TabsContent>

                                {/* Plugins Tab */}
                                <TabsContent value="plugins" className="p-6 m-0">
                                    <PluginsSection moduleId={moduleId || ''} />
                                </TabsContent>

                                {/* UI Map Tab */}
                                <TabsContent value="ui-map" className="p-6 m-0">
                                    <UIMapSection module={module} moduleId={moduleId || ''} />
                                </TabsContent>

                                {/* Tests Tab */}
                                <TabsContent value="tests" className="p-6 m-0">
                                    <TestsSection tests={module.tests} />
                                </TabsContent>

                                {/* API Tab */}
                                <TabsContent value="api" className="p-6 m-0">
                                    <ApiRoutesSection routes={module.api || []} />
                                </TabsContent>

                                {/* Settings Tab */}
                                <TabsContent value="settings" className="p-6 m-0">
                                    {module.settings && Object.keys(module.settings).length > 0 ? (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-6">
                                                Configuration options that can be customized for this module. These settings are defined in the module manifest and can be modified at runtime.
                                            </p>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Setting Key</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Default Value</TableHead>
                                                        <TableHead>Label</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(module.settings).map(([key, setting]: [string, any]) => (
                                                        <TableRow key={key}>
                                                            <TableCell className="font-mono text-sm">{key}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {setting.type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {String(setting.default)}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {setting.label}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                            <p>No configurable settings for this module</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </motion.div>
                    </div>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
