import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '@/hooks/use-auth';
import { getApiError } from '@/lib/api';
import { AuthLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const [searchParams] = useSearchParams();
    const emailParam = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailParam);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const resetPassword = useResetPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError('Invalid reset token');
            return;
        }

        if (password !== passwordConfirmation) {
            setError('Passwords do not match');
            return;
        }

        try {
            await resetPassword.mutateAsync({
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setSuccess(true);
        } catch (err) {
            const apiError = getApiError(err);
            setError(apiError.message);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Password reset successful" subtitle="Your password has been changed">
                <div className="space-y-6">
                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Your password has been reset successfully. You can now sign in with your new password.
                        </AlertDescription>
                    </Alert>

                    <Link to="/login">
                        <Button className="w-full h-10">Continue to sign in</Button>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Set new password" subtitle="Enter your new password below">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                        Email address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-10"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                        New password
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation" className="text-sm font-medium">
                        Confirm new password
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        placeholder="••••••••"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-10"
                    />
                </div>

                <Button type="submit" className="w-full h-10" disabled={resetPassword.isPending}>
                    {resetPassword.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting password...
                        </>
                    ) : (
                        'Reset password'
                    )}
                </Button>

                <Link to="/login">
                    <Button variant="ghost" className="w-full h-10 text-muted-foreground">
                        Back to sign in
                    </Button>
                </Link>
            </form>
        </AuthLayout>
    );
}
