import { useState, useRef } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            if (response.ok) {
                setCurrentPassword('');
                setPassword('');
                setPasswordConfirmation('');
                setRecentlySuccessful(true);
                setTimeout(() => setRecentlySuccessful(false), 2000);
            } else {
                const data = await response.json();
                setErrors(data.errors || {});
                if (data.errors?.current_password) {
                    currentPasswordInput.current?.focus();
                } else {
                    passwordInput.current?.focus();
                }
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
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                ref={currentPasswordInput}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                ref={passwordInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                Save password
                            </Button>

                            {recentlySuccessful && (
                                <p className="text-sm text-muted-foreground">
                                    Saved.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </DashboardLayout>
    );
}
