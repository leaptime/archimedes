import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerDashboard } from '@/hooks/use-partner';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    Wallet,
    Percent,
    Plus,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function PartnerDashboard() {
    const { data, isLoading, error } = usePartnerDashboard();

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">You don't have access to the Partner Portal.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const stats = data?.stats;
    const partner = data?.partner;
    const recentOrgs = data?.recent_organizations || [];
    const revenueData = data?.revenue_by_month || [];

    const statCards = [
        {
            title: 'Total Organizations',
            value: stats?.total_organizations ?? 0,
            subtitle: `${stats?.active_organizations ?? 0} active`,
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Total Users',
            value: stats?.total_users ?? 0,
            subtitle: 'Across all organizations',
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Monthly Revenue',
            value: `$${(stats?.monthly_revenue ?? 0).toLocaleString()}`,
            subtitle: 'This month',
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'Your Commission',
            value: `$${(stats?.monthly_commission ?? 0).toLocaleString()}`,
            subtitle: `${stats?.commission_rate ?? 0}% rate`,
            icon: Percent,
            color: 'text-amber-600',
            bgColor: 'bg-amber-500/10',
        },
        {
            title: 'Pending Payout',
            value: `$${(stats?.pending_payout ?? 0).toLocaleString()}`,
            subtitle: 'Available for withdrawal',
            icon: Wallet,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-500/10',
        },
    ];

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Partner Dashboard"
                subtitle={partner ? `Welcome back, ${partner.name}` : 'Manage your organizations and revenue'}
            >
                <Button asChild>
                    <Link to="/partner/organizations/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Organization
                    </Link>
                </Button>
            </DashboardHeader>

            <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                              <Card key={i}>
                                  <CardContent className="p-6">
                                      <Skeleton className="h-4 w-24 mb-2" />
                                      <Skeleton className="h-8 w-20 mb-1" />
                                      <Skeleton className="h-3 w-16" />
                                  </CardContent>
                              </Card>
                          ))
                        : statCards.map((stat, index) => (
                              <motion.div
                                  key={stat.title}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                              >
                                  <Card>
                                      <CardContent className="p-6">
                                          <div className="flex items-center justify-between mb-4">
                                              <span className="text-sm text-muted-foreground">{stat.title}</span>
                                              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                              </div>
                                          </div>
                                          <div className="text-2xl font-bold">{stat.value}</div>
                                          <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                                      </CardContent>
                                  </Card>
                              </motion.div>
                          ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Revenue & Commission
                            </CardTitle>
                            <CardDescription>Last 6 months performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="month"
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en', { month: 'short' })}
                                            className="text-xs"
                                        />
                                        <YAxis className="text-xs" tickFormatter={(val) => `$${val}`} />
                                        <Tooltip
                                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            name="Revenue"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="commission"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorCommission)"
                                            name="Commission"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No revenue data yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Organizations */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Recent Organizations
                                </CardTitle>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link to="/partner/organizations">
                                        View all
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-32 mb-1" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentOrgs.length > 0 ? (
                                <div className="space-y-4">
                                    {recentOrgs.map((org) => (
                                        <Link
                                            key={org.id}
                                            to={`/partner/organizations/${org.id}`}
                                            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{org.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {org.users_count} users · {org.plan}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    org.status === 'active'
                                                        ? 'text-green-600 border-green-500/30'
                                                        : org.status === 'trial'
                                                        ? 'text-blue-600 border-blue-500/30'
                                                        : 'text-amber-600 border-amber-500/30'
                                                }
                                            >
                                                {org.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No organizations yet</p>
                                    <Button variant="link" asChild className="mt-2">
                                        <Link to="/partner/organizations/new">Create your first organization</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                <Link to="/partner/organizations/new">
                                    <Plus className="w-5 h-5" />
                                    <span>New Organization</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                <Link to="/partner/organizations">
                                    <Building2 className="w-5 h-5" />
                                    <span>Manage Organizations</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                <Link to="/partner/revenue">
                                    <DollarSign className="w-5 h-5" />
                                    <span>View Revenue</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                                <Link to="/partner/settings">
                                    <Wallet className="w-5 h-5" />
                                    <span>Payout Settings</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
