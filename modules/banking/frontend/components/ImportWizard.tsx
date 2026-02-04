import { useState, useCallback, ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
} from 'lucide-react';

interface BankAccount {
    id: number;
    name: string;
    account_number?: string;
}

interface PreviewTransaction {
    date: string;
    amount: number;
    payment_ref?: string;
    partner_name?: string;
    currency_code?: string;
}

interface ImportPreview {
    format: string;
    total_count: number;
    account_number?: string;
    opening_balance?: number;
    closing_balance?: number;
    currency?: string;
    transactions: PreviewTransaction[];
}

interface ImportResult {
    transactions_imported: number;
    transactions_skipped: number;
    total_amount: number;
    status: string;
}

interface ImportWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: BankAccount[];
    onImport: (accountId: number, file: File, format?: string) => Promise<ImportResult>;
    onPreview: (file: File, format?: string) => Promise<ImportPreview>;
}

type Step = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportWizard({
    open,
    onOpenChange,
    accounts,
    onImport,
    onPreview,
}: ImportWizardProps) {
    const [step, setStep] = useState<Step>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [format, setFormat] = useState<string>('');
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/x-ofx': ['.ofx', '.qfx'],
            'text/x-qif': ['.qif'],
            'application/xml': ['.xml', '.camt', '.camt053'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
    });

    const handlePreview = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);

        try {
            const result = await onPreview(selectedFile, format || undefined);
            setPreview(result);
            setStep('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to preview file');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile || !selectedAccount) return;

        setStep('importing');
        setError(null);

        try {
            const result = await onImport(parseInt(selectedAccount), selectedFile, format || undefined);
            setResult(result);
            setStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
            setStep('preview');
        }
    };

    const handleClose = () => {
        setStep('upload');
        setSelectedFile(null);
        setSelectedAccount('');
        setFormat('');
        setPreview(null);
        setResult(null);
        setError(null);
        onOpenChange(false);
    };

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import Bank Transactions</DialogTitle>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {step === 'upload' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Account</label>
                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name}
                                            {account.account_number && ` (****${account.account_number.slice(-4)})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div
                            {...getRootProps()}
                            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                            }`}
                        >
                            <input {...getInputProps()} />
                            {selectedFile ? (
                                <>
                                    <FileText className="h-12 w-12 text-primary" />
                                    <p className="mt-4 font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                    <Button
                                        variant="link"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                        }}
                                    >
                                        Choose a different file
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-center">
                                        {isDragActive
                                            ? 'Drop the file here'
                                            : 'Drag and drop a file here, or click to select'}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Supported formats: CSV, OFX, QIF, CAMT.053
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Format (optional)</label>
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Auto-detect" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Auto-detect</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="ofx">OFX / QFX</SelectItem>
                                    <SelectItem value="qif">QIF</SelectItem>
                                    <SelectItem value="camt">CAMT.053</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {step === 'preview' && preview && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <p className="text-2xl font-bold">{preview.total_count}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">Format</p>
                                <p className="text-2xl font-bold uppercase">{preview.format}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">Currency</p>
                                <p className="text-2xl font-bold">{preview.currency || 'EUR'}</p>
                            </div>
                        </div>

                        {(preview.opening_balance !== undefined || preview.closing_balance !== undefined) && (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Opening Balance</p>
                                    <p className="font-medium">
                                        {preview.opening_balance !== undefined
                                            ? formatCurrency(preview.opening_balance, preview.currency)
                                            : '-'}
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Closing Balance</p>
                                    <p className="font-medium">
                                        {preview.closing_balance !== undefined
                                            ? formatCurrency(preview.closing_balance, preview.currency)
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="mb-2 font-medium">Preview (first {preview.transactions.length} transactions)</h4>
                            <div className="max-h-64 overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Partner</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {preview.transactions.map((tx, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {tx.date ? format(new Date(tx.date), 'MMM d, yyyy') : '-'}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {tx.payment_ref || '-'}
                                                </TableCell>
                                                <TableCell>{tx.partner_name || '-'}</TableCell>
                                                <TableCell
                                                    className={`text-right ${
                                                        tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {formatCurrency(tx.amount, tx.currency_code || preview.currency)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-lg font-medium">Importing transactions...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment</p>
                    </div>
                )}

                {step === 'complete' && result && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center py-8">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <h3 className="mt-4 text-xl font-semibold">Import Complete!</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-green-50 p-4 text-center">
                                <p className="text-sm text-green-600">Imported</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {result.transactions_imported}
                                </p>
                            </div>
                            <div className="rounded-lg bg-yellow-50 p-4 text-center">
                                <p className="text-sm text-yellow-600">Skipped</p>
                                <p className="text-3xl font-bold text-yellow-700">
                                    {result.transactions_skipped}
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-4 text-center">
                                <p className="text-sm text-blue-600">Total Amount</p>
                                <p className="text-xl font-bold text-blue-700">
                                    {formatCurrency(result.total_amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'upload' && (
                        <Button
                            onClick={handlePreview}
                            disabled={!selectedFile || !selectedAccount || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Preview
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}

                    {step === 'preview' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('upload')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button onClick={handleImport}>
                                Import {preview?.total_count} Transactions
                            </Button>
                        </>
                    )}

                    {step === 'complete' && (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ImportWizard;
