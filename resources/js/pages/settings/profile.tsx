import { useState, useEffect } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useAuth } from '@/contexts/auth-context';

export default function Profile() {
    const { user, refresh } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            });

            if (response.ok) {
                await refresh();
                setRecentlySuccessful(true);
                setTimeout(() => setRecentlySuccessful(false), 2000);
            } else {
                const data = await response.json();
                setErrors(data.errors || {});
            }
        } catch (error) {
            setErrors({ general: 'An error occurred' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>

                            {recentlySuccessful && (
                                <p className="text-sm text-muted-foreground">
                                    Saved.
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </DashboardLayout>
    );
}
