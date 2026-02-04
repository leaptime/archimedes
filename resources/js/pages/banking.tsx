import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Banking() {
    return (
        <DashboardLayout>
            <DashboardHeader
                title="Banking"
                subtitle="Manage your bank accounts and transactions"
            />
            <div className="space-y-6 p-6">

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bank Accounts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">
                                Connected accounts
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">
                                Pending reconciliation
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">$0.00</p>
                            <p className="text-xs text-muted-foreground">
                                Total balance
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
