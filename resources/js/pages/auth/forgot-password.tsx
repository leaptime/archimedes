import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/use-auth';
import { getApiError } from '@/lib/api';
import { AuthLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const forgotPassword = useForgotPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            await forgotPassword.mutateAsync(email);
            setSuccess(true);
        } catch (err) {
            const apiError = getApiError(err);
            setError(apiError.message);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Check your email" subtitle="We sent you a password reset link">
                <div className="space-y-6">
                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            We've sent a password reset link to <strong>{email}</strong>. 
                            Please check your inbox and spam folder.
                        </AlertDescription>
                    </Alert>

                    <p className="text-sm text-muted-foreground">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                            type="button"
                            onClick={() => setSuccess(false)}
                            className="font-medium text-primary hover:underline"
                        >
                            try again
                        </button>
                    </p>

                    <Link to="/login">
                        <Button variant="outline" className="w-full h-10">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to sign in
                        </Button>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            title="Reset your password" 
            subtitle="Enter your email and we'll send you a reset link"
        >
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

                <Button type="submit" className="w-full h-10" disabled={forgotPassword.isPending}>
                    {forgotPassword.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Send reset link'
                    )}
                </Button>

                <Link to="/login">
                    <Button variant="ghost" className="w-full h-10 text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                    </Button>
                </Link>
            </form>
        </AuthLayout>
    );
}
