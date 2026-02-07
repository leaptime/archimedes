import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformPartnerStats, usePlatformOrganizationStats } from '@/hooks/use-platform';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    Building2,
    Handshake,
    DollarSign,
    TrendingUp,
    Wallet,
    Plus,
    ArrowRight,
    Shield,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PlatformDashboard() {
    const { data: partnerStats, isLoading: partnerLoading } = usePlatformPartnerStats();
    const { data: orgStats, isLoading: orgLoading } = usePlatformOrganizationStats();

    const isLoading = partnerLoading || orgLoading;

    const pStats = partnerStats?.data;
    const oStats = orgStats?.data;

    const orgTypeData = oStats?.by_type
        ? Object.entries(oStats.by_type).map(([name, value]) => ({ name, value }))
        : [];

    const orgPlanData = oStats?.by_plan
        ? Object.entries(oStats.by_plan).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Platform Administration"
                subtitle="Manage partners, organizations, and platform settings"
            >
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/platform/partners/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Partner
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link to="/platform/organizations/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Organization
                        </Link>
                    </Button>
                </div>
            </DashboardHeader>

            <div className="p-6 space-y-6">
                {/* Alert Banner */}
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-600">Platform Admin Mode</p>
                                <p className="text-sm text-muted-foreground">
                                    You have full access to all organizations and data. Changes here affect the entire platform.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Partners Stats */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Total Partners</span>
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <Handshake className="w-4 h-4 text-purple-600" />
                                    </div>
                                </div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{pStats?.total_partners ?? 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {pStats?.active_partners ?? 0} active
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Total Organizations</span>
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{oStats?.total ?? 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {oStats?.new_this_month ?? 0} new this month
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Total Users</span>
                                    <div className="p-2 rounded-lg bg-green-500/10">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{oStats?.total_users ?? 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Across all organizations
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Pending Payouts</span>
                                    <div className="p-2 rounded-lg bg-amber-500/10">
                                        <Wallet className="w-4 h-4 text-amber-600" />
                                    </div>
                                </div>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-20" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            ${(pStats?.pending_payouts_amount ?? 0).toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            To partners
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Organization Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{oStats?.active ?? 0}</p>
                            <p className="text-sm text-muted-foreground">Active</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{oStats?.trial ?? 0}</p>
                            <p className="text-sm text-muted-foreground">Trial</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-amber-600">{oStats?.suspended ?? 0}</p>
                            <p className="text-sm text-muted-foreground">Suspended</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-500/5 border-purple-500/20">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {pStats?.total_organizations_via_partners ?? 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Via Partners</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organizations by Type</CardTitle>
                            <CardDescription>Distribution of organization types</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[250px] w-full" />
                            ) : orgTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={orgTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {orgTypeData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    No data yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organizations by Plan</CardTitle>
                            <CardDescription>Distribution of subscription plans</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[250px] w-full" />
                            ) : orgPlanData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={orgPlanData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {orgPlanData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    No data yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Handshake className="w-5 h-5" />
                                    Partners
                                </CardTitle>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link to="/platform/partners">
                                        View all
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Link
                                    to="/platform/partners"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span>Manage Partners</span>
                                    <Badge variant="outline">{pStats?.total_partners ?? 0}</Badge>
                                </Link>
                                <Link
                                    to="/platform/partners/new"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span>Add New Partner</span>
                                    <Plus className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/platform/payouts"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span>Process Payouts</span>
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                                        ${(pStats?.pending_payouts_amount ?? 0).toLocaleString()}
                                    </Badge>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Organizations
                                </CardTitle>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link to="/platform/organizations">
                                        View all
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Link
                                    to="/platform/organizations"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span>Manage Organizations</span>
                                    <Badge variant="outline">{oStats?.total ?? 0}</Badge>
                                </Link>
                                <Link
                                    to="/platform/organizations/new"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span>Add New Organization</span>
                                    <Plus className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/platform/organizations?status=trial"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <span>Trial Organizations</span>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                                        {oStats?.trial ?? 0}
                                    </Badge>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
