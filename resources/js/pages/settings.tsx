import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
    return (
        <DashboardLayout>
            <DashboardHeader title="Settings" subtitle="Configure your account and preferences" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Settings and configuration options coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
