import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useAuth } from '@/contexts/auth-context';

export default function TwoFactor() {
    const { user } = useAuth();
    const twoFactorEnabled = user?.two_factor_enabled || false;

    return (
        <DashboardLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Two-Factor Authentication"
                        description="Add additional security to your account using two-factor authentication"
                    />

                    {twoFactorEnabled ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Two-factor authentication is currently enabled. You can disable it below.
                            </p>
                            <Button variant="destructive">
                                Disable Two-Factor Authentication
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Two-factor authentication is not enabled. Enable it to add an extra layer of security.
                            </p>
                            <Button>
                                Enable Two-Factor Authentication
                            </Button>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </DashboardLayout>
    );
}
