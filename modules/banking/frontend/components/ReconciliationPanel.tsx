import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowUpRight,
    ArrowDownLeft,
    FileText,
    CreditCard,
    Sparkles,
    Link2,
    Loader2,
    CheckCircle2,
    Search,
    Plus,
} from 'lucide-react';

interface Transaction {
    id: number;
    date: string;
    payment_ref: string;
    partner_name?: string;
    amount: number;
    currency_code: string;
    is_reconciled: boolean;
}

interface Suggestion {
    type: 'invoice' | 'payment' | 'model';
    id: number;
    reference?: string;
    name?: string;
    partner_name?: string;
    amount: number;
    date?: string;
    due_date?: string;
    score: number;
    match_type: 'perfect' | 'high' | 'medium' | 'low';
}

interface ReconciliationPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction | null;
    onReconcile: (transactionId: number, matches: { type: string; id: number; amount: number }[]) => Promise<void>;
    onFetchSuggestions: (transactionId: number) => Promise<Suggestion[]>;
}

export function ReconciliationPanel({
    open,
    onOpenChange,
    transaction,
    onReconcile,
    onFetchSuggestions,
}: ReconciliationPanelProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedMatches, setSelectedMatches] = useState<Map<string, Suggestion>>(new Map());
    const [loading, setLoading] = useState(false);
    const [reconciling, setReconciling] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [manualAmount, setManualAmount] = useState('');

    useEffect(() => {
        if (open && transaction) {
            loadSuggestions();
            setSelectedMatches(new Map());
            setManualAmount('');
        }
    }, [open, transaction]);

    const loadSuggestions = async () => {
        if (!transaction) return;

        setLoading(true);
        try {
            const result = await onFetchSuggestions(transaction.id);
            setSuggestions(result);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMatch = (suggestion: Suggestion) => {
        const key = `${suggestion.type}-${suggestion.id}`;
        const newSelected = new Map(selectedMatches);

        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.set(key, suggestion);
        }

        setSelectedMatches(newSelected);
    };

    const totalSelected = Array.from(selectedMatches.values()).reduce(
        (sum, match) => sum + Math.abs(match.amount),
        0
    );

    const transactionAmount = transaction ? Math.abs(transaction.amount) : 0;
    const difference = transactionAmount - totalSelected;

    const handleReconcile = async () => {
        if (!transaction || selectedMatches.size === 0) return;

        setReconciling(true);
        try {
            const matches = Array.from(selectedMatches.values()).map((match) => ({
                type: match.type,
                id: match.id,
                amount: match.amount,
            }));

            await onReconcile(transaction.id, matches);
            onOpenChange(false);
        } catch (error) {
            console.error('Reconciliation failed:', error);
        } finally {
            setReconciling(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const getMatchBadge = (matchType: string) => {
        switch (matchType) {
            case 'perfect':
                return <Badge className="bg-green-500">Perfect Match</Badge>;
            case 'high':
                return <Badge className="bg-blue-500">High</Badge>;
            case 'medium':
                return <Badge variant="outline">Medium</Badge>;
            default:
                return <Badge variant="secondary">Low</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'invoice':
                return <FileText className="h-4 w-4" />;
            case 'payment':
                return <CreditCard className="h-4 w-4" />;
            case 'model':
                return <Sparkles className="h-4 w-4" />;
            default:
                return <Link2 className="h-4 w-4" />;
        }
    };

    const filteredSuggestions = suggestions.filter((s) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            s.reference?.toLowerCase().includes(search) ||
            s.name?.toLowerCase().includes(search) ||
            s.partner_name?.toLowerCase().includes(search)
        );
    });

    const invoiceSuggestions = filteredSuggestions.filter((s) => s.type === 'invoice');
    const paymentSuggestions = filteredSuggestions.filter((s) => s.type === 'payment');
    const modelSuggestions = filteredSuggestions.filter((s) => s.type === 'model');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[500px] sm:max-w-[500px]">
                <SheetHeader>
                    <SheetTitle>Reconcile Transaction</SheetTitle>
                </SheetHeader>

                {transaction && (
                    <div className="mt-6 space-y-6">
                        {/* Transaction Info */}
                        <div className="rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {transaction.amount >= 0 ? (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                            <ArrowDownLeft className="h-5 w-5 text-green-600" />
                                        </div>
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{transaction.payment_ref || 'Transaction'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(transaction.date), 'MMMM d, yyyy')}
                                        </p>
                                        {transaction.partner_name && (
                                            <p className="text-sm text-muted-foreground">
                                                {transaction.partner_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p
                                    className={`text-xl font-bold ${
                                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}
                                >
                                    {formatCurrency(transaction.amount, transaction.currency_code)}
                                </p>
                            </div>
                        </div>

                        {/* Selected Matches Summary */}
                        {selectedMatches.size > 0 && (
                            <div className="rounded-lg bg-muted p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Selected ({selectedMatches.size})</span>
                                    <span className="font-medium">{formatCurrency(totalSelected)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-sm">Difference</span>
                                    <span
                                        className={`font-medium ${
                                            Math.abs(difference) < 0.01
                                                ? 'text-green-600'
                                                : 'text-yellow-600'
                                        }`}
                                    >
                                        {formatCurrency(difference)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search matches..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Suggestions */}
                        <Tabs defaultValue="all" className="flex-1">
                            <TabsList className="w-full">
                                <TabsTrigger value="all" className="flex-1">
                                    All ({filteredSuggestions.length})
                                </TabsTrigger>
                                <TabsTrigger value="invoices" className="flex-1">
                                    Invoices ({invoiceSuggestions.length})
                                </TabsTrigger>
                                <TabsTrigger value="payments" className="flex-1">
                                    Payments ({paymentSuggestions.length})
                                </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="mt-4 h-[300px]">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <TabsContent value="all" className="mt-0">
                                            <SuggestionList
                                                suggestions={filteredSuggestions}
                                                selectedMatches={selectedMatches}
                                                onToggle={toggleMatch}
                                                formatCurrency={formatCurrency}
                                                getMatchBadge={getMatchBadge}
                                                getTypeIcon={getTypeIcon}
                                            />
                                        </TabsContent>
                                        <TabsContent value="invoices" className="mt-0">
                                            <SuggestionList
                                                suggestions={invoiceSuggestions}
                                                selectedMatches={selectedMatches}
                                                onToggle={toggleMatch}
                                                formatCurrency={formatCurrency}
                                                getMatchBadge={getMatchBadge}
                                                getTypeIcon={getTypeIcon}
                                            />
                                        </TabsContent>
                                        <TabsContent value="payments" className="mt-0">
                                            <SuggestionList
                                                suggestions={paymentSuggestions}
                                                selectedMatches={selectedMatches}
                                                onToggle={toggleMatch}
                                                formatCurrency={formatCurrency}
                                                getMatchBadge={getMatchBadge}
                                                getTypeIcon={getTypeIcon}
                                            />
                                        </TabsContent>
                                    </>
                                )}
                            </ScrollArea>
                        </Tabs>

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleReconcile}
                                disabled={selectedMatches.size === 0 || reconciling}
                            >
                                {reconciling ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Reconcile
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function SuggestionList({
    suggestions,
    selectedMatches,
    onToggle,
    formatCurrency,
    getMatchBadge,
    getTypeIcon,
}: {
    suggestions: Suggestion[];
    selectedMatches: Map<string, Suggestion>;
    onToggle: (suggestion: Suggestion) => void;
    formatCurrency: (amount: number, currency?: string) => string;
    getMatchBadge: (matchType: string) => React.ReactNode;
    getTypeIcon: (type: string) => React.ReactNode;
}) {
    if (suggestions.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
                No matches found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {suggestions.map((suggestion) => {
                const key = `${suggestion.type}-${suggestion.id}`;
                const isSelected = selectedMatches.has(key);

                return (
                    <div
                        key={key}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => onToggle(suggestion)}
                    >
                        <Checkbox checked={isSelected} />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {getTypeIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                    {suggestion.reference || suggestion.name || `#${suggestion.id}`}
                                </span>
                                {getMatchBadge(suggestion.match_type)}
                            </div>
                            {suggestion.partner_name && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {suggestion.partner_name}
                                </p>
                            )}
                            {suggestion.date && (
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(suggestion.date), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                        <span className="font-medium">{formatCurrency(suggestion.amount)}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default ReconciliationPanel;
