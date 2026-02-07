import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { usePartnerRevenue, usePartnerPayouts } from '@/hooks/use-partner';
import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    Wallet,
    Download,
    Calendar,
    Building2,
    ChevronLeft,
    ChevronRight,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';

const statusColors: Record<string, string> = {
    pending: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
    approved: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
    paid: 'text-green-600 border-green-500/30 bg-green-500/10',
    processing: 'text-purple-600 border-purple-500/30 bg-purple-500/10',
    completed: 'text-green-600 border-green-500/30 bg-green-500/10',
    failed: 'text-red-600 border-red-500/30 bg-red-500/10',
};

const statusIcons: Record<string, React.ElementType> = {
    pending: Clock,
    approved: CheckCircle2,
    paid: CheckCircle2,
    processing: Clock,
    completed: CheckCircle2,
    failed: AlertCircle,
};

const typeLabels: Record<string, string> = {
    subscription: 'Subscription',
    module: 'Module',
    users: 'Users',
    storage: 'Storage',
    overage: 'Overage',
};

const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

export default function PartnerRevenue() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [revenuePage, setRevenuePage] = useState(1);
    const [payoutPage, setPayoutPage] = useState(1);

    const { data: revenueData, isLoading: revenueLoading } = usePartnerRevenue({
        year,
        month,
        page: revenuePage,
    });

    const { data: payoutsData, isLoading: payoutsLoading } = usePartnerPayouts({
        page: payoutPage,
    });

    const revenue = revenueData?.revenue?.data || [];
    const revenueMeta = revenueData?.revenue?.meta;
    const summary = revenueData?.summary;
    const payouts = payoutsData?.data || [];
    const payoutsMeta = payoutsData?.meta;

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Revenue & Payouts"
                subtitle="Track your earnings and commission payments"
            />

            <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Gross Revenue</span>
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <DollarSign className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                                {revenueLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <div className="text-2xl font-bold">
                                        ${(summary?.total_gross ?? 0).toLocaleString()}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {months.find(m => m.value === String(month))?.label} {year}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Your Commission</span>
                                    <div className="p-2 rounded-lg bg-green-500/10">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>
                                {revenueLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <div className="text-2xl font-bold text-green-600">
                                        ${(summary?.total_commission ?? 0).toLocaleString()}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {months.find(m => m.value === String(month))?.label} {year}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Pending Payout</span>
                                    <div className="p-2 rounded-lg bg-amber-500/10">
                                        <Wallet className="w-4 h-4 text-amber-600" />
                                    </div>
                                </div>
                                {payoutsLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <div className="text-2xl font-bold">
                                        ${payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Awaiting payment
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <Tabs defaultValue="revenue" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="revenue">Revenue Details</TabsTrigger>
                        <TabsTrigger value="payouts">Payouts</TabsTrigger>
                    </TabsList>

                    {/* Revenue Tab */}
                    <TabsContent value="revenue">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Revenue by Organization</CardTitle>
                                        <CardDescription>Detailed breakdown of revenue and commission</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Select value={String(month)} onValueChange={(v) => { setMonth(Number(v)); setRevenuePage(1); }}>
                                            <SelectTrigger className="w-[130px]">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setRevenuePage(1); }}>
                                            <SelectTrigger className="w-[100px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {years.map((y) => (
                                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Gross</TableHead>
                                            <TableHead className="text-right">Rate</TableHead>
                                            <TableHead className="text-right">Commission</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {revenueLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : revenue.length > 0 ? (
                                            revenue.map((item, index) => {
                                                const StatusIcon = statusIcons[item.status] || Clock;
                                                return (
                                                    <motion.tr
                                                        key={item.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                                                <span className="font-medium">
                                                                    {item.organization?.name || 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {typeLabels[item.type] || item.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {item.description}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            ${Number(item.gross_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {item.commission_rate}%
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-green-600">
                                                            ${Number(item.commission_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[item.status]}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {item.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </motion.tr>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center">
                                                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                                    <p className="text-muted-foreground">No revenue data for this period</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {revenueMeta && revenueMeta.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {revenueMeta.from} to {revenueMeta.to} of {revenueMeta.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRevenuePage(revenuePage - 1)}
                                                disabled={revenuePage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="text-sm">Page {revenuePage}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRevenuePage(revenuePage + 1)}
                                                disabled={revenuePage === revenueMeta.last_page}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payouts Tab */}
                    <TabsContent value="payouts">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payout History</CardTitle>
                                <CardDescription>Your commission payment history</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Paid At</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payoutsLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : payouts.length > 0 ? (
                                            payouts.map((payout, index) => {
                                                const StatusIcon = statusIcons[payout.status] || Clock;
                                                return (
                                                    <motion.tr
                                                        key={payout.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                    >
                                                        <TableCell className="font-mono text-sm">
                                                            {payout.reference}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            ${Number(payout.amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            {payout.payment_method?.replace('_', ' ')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[payout.status]}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {payout.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {payout.paid_at
                                                                ? new Date(payout.paid_at).toLocaleDateString()
                                                                : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon">
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </motion.tr>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center">
                                                    <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                                                    <p className="text-muted-foreground">No payouts yet</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {payoutsMeta && payoutsMeta.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {payoutsMeta.from} to {payoutsMeta.to} of {payoutsMeta.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPayoutPage(payoutPage - 1)}
                                                disabled={payoutPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="text-sm">Page {payoutPage}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPayoutPage(payoutPage + 1)}
                                                disabled={payoutPage === payoutsMeta.last_page}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
