import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Wizard() {
    return (
        <DashboardLayout>
            <DashboardHeader title="Setup Wizard" subtitle="Get started with your SaaS stack" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to the Setup Wizard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Guided setup wizard coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
