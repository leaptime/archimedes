import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AlertErrorProps {
    message?: string;
    errors?: string[];
    title?: string;
}

export function AlertError({ message, errors, title }: AlertErrorProps) {
    const errorList = errors || (message ? [message] : []);
    
    if (errorList.length === 0) return null;

    return (
        <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>{title || 'Error'}</AlertTitle>
            <AlertDescription>
                {errorList.length === 1 ? (
                    <p className="text-sm">{errorList[0]}</p>
                ) : (
                    <ul className="list-inside list-disc text-sm">
                        {Array.from(new Set(errorList)).map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                )}
            </AlertDescription>
        </Alert>
    );
}

export default AlertError;
