import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Upgrades() {
    return (
        <DashboardLayout>
            <DashboardHeader title="Upgrades" subtitle="View available updates and pricing" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Upgrades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Module updates and pricing plans coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
