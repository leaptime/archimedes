import { useUser } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { Spinner } from '@/components/ui/spinner';

export default function Dashboard() {
    const { isLoading } = useUser();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHome />
        </DashboardLayout>
    );
}
