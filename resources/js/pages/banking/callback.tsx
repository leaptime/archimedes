import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

type CallbackStatus = 'processing' | 'success' | 'error';

interface CallbackState {
    status: CallbackStatus;
    message: string;
    details?: string;
}

export default function BankingCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [state, setState] = useState<CallbackState>({
        status: 'processing',
        message: 'Completing bank connection...',
    });

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        // Get callback parameters
        const ref = searchParams.get('ref'); // GoCardless requisition ID
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors from provider
        if (error) {
            setState({
                status: 'error',
                message: 'Authorization Failed',
                details: errorDescription || error,
            });
            return;
        }

        // Get stored connection data from sessionStorage
        const pendingConnection = sessionStorage.getItem('pending_bank_connection');
        if (!pendingConnection) {
            setState({
                status: 'error',
                message: 'Connection Session Expired',
                details: 'Please start the connection process again.',
            });
            return;
        }

        const connectionData = JSON.parse(pendingConnection);

        // GoCardless callback
        if (ref || connectionData.provider === 'gocardless') {
            await completeGoCardlessConnection(ref || connectionData.requisition_id, connectionData);
            return;
        }

        // Unknown callback type
        setState({
            status: 'error',
            message: 'Unknown Callback Type',
            details: 'Unable to process this callback.',
        });
    };

    const completeGoCardlessConnection = async (requisitionId: string, connectionData: any) => {
        try {
            const response = await fetch('/api/banking/open-banking/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: 'gocardless',
                    code: requisitionId,
                    bank_account_id: connectionData.bank_account_id,
                    institution_id: connectionData.institution_id,
                    institution_name: connectionData.institution_name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to complete connection');
            }

            // Clear pending connection
            sessionStorage.removeItem('pending_bank_connection');

            setState({
                status: 'success',
                message: 'Bank Connected Successfully!',
                details: `Your ${connectionData.institution_name || 'bank'} account is now connected and will sync automatically.`,
            });

        } catch (err) {
            setState({
                status: 'error',
                message: 'Connection Failed',
                details: err instanceof Error ? err.message : 'An unexpected error occurred.',
            });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {state.status === 'processing' && (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        )}
                        {state.status === 'success' && (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        )}
                        {state.status === 'error' && (
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        )}
                    </div>
                    <CardTitle>{state.message}</CardTitle>
                    {state.details && (
                        <CardDescription>{state.details}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {state.status === 'processing' && (
                        <p className="text-center text-sm text-muted-foreground">
                            Please wait while we verify your bank connection...
                        </p>
                    )}

                    {state.status === 'success' && (
                        <div className="space-y-4">
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Transactions will be imported automatically every 6 hours.
                                </AlertDescription>
                            </Alert>
                            <Button className="w-full" onClick={() => navigate('/banking')}>
                                Go to Banking
                            </Button>
                        </div>
                    )}

                    {state.status === 'error' && (
                        <div className="space-y-4">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{state.details}</AlertDescription>
                            </Alert>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate('/banking')}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Banking
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        setState({
                                            status: 'processing',
                                            message: 'Retrying...',
                                        });
                                        handleCallback();
                                    }}
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
