import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Analytics() {
    return (
        <DashboardLayout>
            <DashboardHeader title="Analytics" subtitle="View detailed metrics and insights" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Analytics Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Detailed analytics and reporting coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
