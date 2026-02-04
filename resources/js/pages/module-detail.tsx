import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useModuleDetail } from '@/hooks/use-modules';

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
        <div className="space-y-6">
            {Object.entries(ui).map(([category, components]) => (
                <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        {uiTypeIcons[category.slice(0, -1)] || <Component className="w-4 h-4" />}
                        {uiTypeLabels[category] || category}
                        <Badge variant="secondary" className="text-xs ml-2">
                            {components.length}
                        </Badge>
                    </h4>
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

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Puzzle className="w-4 h-4" />
                                    <span className="text-sm">Extensions</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {Object.keys(module.extensions || {}).length}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Database className="w-4 h-4" />
                                    <span className="text-sm">Models</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {(module.models || []).length}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Component className="w-4 h-4" />
                                    <span className="text-sm">UI Components</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {Object.values(module.ui || {}).flat().length}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Permissions</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {(module.permissions || []).length}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Settings className="w-4 h-4" />
                                    <span className="text-sm">Settings</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {Object.keys(module.settings || {}).length}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <TestTube2 className="w-4 h-4" />
                                    <span className="text-sm">Tests</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {module.tests?.totalTests || 0}
                                </p>
                            </motion.div>
                        </div>

                        {/* Models Section */}
                        {module.models && module.models.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-6 bg-card border border-border rounded-xl"
                            >
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Database className="w-5 h-5" />
                                    Models
                                </h3>
                                <ModelsTable models={module.models} />
                            </motion.div>
                        )}

                        {/* UI Components Section */}
                        {module.ui && Object.keys(module.ui).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="p-6 bg-card border border-border rounded-xl"
                            >
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Component className="w-5 h-5" />
                                    UI Components
                                </h3>
                                <UIComponentsSection ui={module.ui} />
                            </motion.div>
                        )}

                        {/* Extensions Section */}
                        {module.extensions && Object.keys(module.extensions).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="p-6 bg-card border border-border rounded-xl"
                            >
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Puzzle className="w-5 h-5" />
                                    Extensions
                                </h3>
                                
                                {Object.entries(module.extensions).map(([target, ext]: [string, any]) => (
                                    <div key={target} className="mb-6 last:mb-0">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                                Extends: {target}
                                            </Badge>
                                        </div>
                                        
                                        <Tabs defaultValue="fields" className="w-full">
                                            <TabsList>
                                                <TabsTrigger value="fields" className="gap-2">
                                                    <Layers className="w-4 h-4" />
                                                    Fields ({Object.keys(ext.fields || {}).length})
                                                </TabsTrigger>
                                                <TabsTrigger value="relationships" className="gap-2">
                                                    <LinkIcon className="w-4 h-4" />
                                                    Relationships ({(ext.relationships || []).length})
                                                </TabsTrigger>
                                                <TabsTrigger value="computed" className="gap-2">
                                                    <Calculator className="w-4 h-4" />
                                                    Computed ({(ext.computed || []).length})
                                                </TabsTrigger>
                                                <TabsTrigger value="scopes" className="gap-2">
                                                    <Filter className="w-4 h-4" />
                                                    Scopes ({(ext.scopes || []).length})
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="fields" className="mt-4">
                                                <FieldsTable fields={ext.fields || {}} />
                                            </TabsContent>
                                            <TabsContent value="relationships" className="mt-4">
                                                <RelationshipsTable relationships={ext.relationships || []} />
                                            </TabsContent>
                                            <TabsContent value="computed" className="mt-4">
                                                <ComputedTable computed={ext.computed || []} />
                                            </TabsContent>
                                            <TabsContent value="scopes" className="mt-4">
                                                <ScopesTable scopes={ext.scopes || []} />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Tests Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                            className="p-6 bg-card border border-border rounded-xl"
                        >
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TestTube2 className="w-5 h-5" />
                                E2E Tests
                            </h3>
                            <TestsSection tests={module.tests} />
                        </motion.div>

                        {/* Permissions Section */}
                        {module.permissions && module.permissions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="p-6 bg-card border border-border rounded-xl"
                            >
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Permissions
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {module.permissions.map((perm: string) => (
                                        <Badge key={perm} variant="outline" className="font-mono text-xs">
                                            {perm}
                                        </Badge>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Settings Section */}
                        {module.settings && Object.keys(module.settings).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="p-6 bg-card border border-border rounded-xl"
                            >
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Settings Schema
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Setting</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Default</TableHead>
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
                                                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
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
                            </motion.div>
                        )}
                    </div>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
