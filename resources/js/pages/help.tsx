import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Help() {
    return (
        <DashboardLayout>
            <DashboardHeader title="Help & Support" subtitle="Documentation and assistance" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Help Center</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Documentation and AI chatbot coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
