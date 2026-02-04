import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTwoFactorChallenge } from '@/hooks/use-auth';
import { getApiError } from '@/lib/api';
import { AuthLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Shield, ArrowLeft } from 'lucide-react';

export default function TwoFactorChallenge() {
    const [code, setCode] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [useRecovery, setUseRecovery] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const twoFactorChallenge = useTwoFactorChallenge();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await twoFactorChallenge.mutateAsync(
                useRecovery ? { recovery_code: recoveryCode } : { code }
            );
            window.location.href = '/dashboard';
        } catch (err) {
            const apiError = getApiError(err);
            setError(apiError.message);
        }
    };

    return (
        <AuthLayout
            title="Two-factor authentication"
            subtitle={
                useRecovery
                    ? 'Enter one of your recovery codes to continue'
                    : 'Enter the 6-digit code from your authenticator app'
            }
        >
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {useRecovery ? (
                    <div className="space-y-2">
                        <Label htmlFor="recovery_code" className="text-sm font-medium">
                            Recovery code
                        </Label>
                        <Input
                            id="recovery_code"
                            type="text"
                            placeholder="xxxxx-xxxxx"
                            value={recoveryCode}
                            onChange={(e) => setRecoveryCode(e.target.value)}
                            required
                            autoComplete="off"
                            className="h-10 font-mono text-center tracking-widest"
                        />
                        <p className="text-xs text-muted-foreground">
                            Recovery codes were provided when you enabled 2FA
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium">
                            Authentication code
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setCode(value);
                            }}
                            required
                            autoComplete="one-time-code"
                            maxLength={6}
                            inputMode="numeric"
                            className="h-12 text-center text-2xl font-mono tracking-[0.5em]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Open your authenticator app to view the code
                        </p>
                    </div>
                )}

                <Button type="submit" className="w-full h-10" disabled={twoFactorChallenge.isPending}>
                    {twoFactorChallenge.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify'
                    )}
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-10 text-muted-foreground"
                    onClick={() => {
                        setUseRecovery(!useRecovery);
                        setCode('');
                        setRecoveryCode('');
                        setError(null);
                    }}
                >
                    {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}
                </Button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                </div>

                <Link to="/login">
                    <Button variant="outline" className="w-full h-10">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                    </Button>
                </Link>
            </form>
        </AuthLayout>
    );
}
