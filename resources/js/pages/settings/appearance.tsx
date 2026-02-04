import Heading from '@/components/heading';
import { AppearanceTabs } from '@/components/appearance-tabs';
import { DashboardLayout } from '@/components/layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <DashboardLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </DashboardLayout>
    );
}
