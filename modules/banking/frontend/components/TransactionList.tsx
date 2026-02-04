import { useState } from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowUpRight,
    ArrowDownLeft,
    MoreHorizontal,
    Search,
    Filter,
    CheckCircle2,
    Circle,
    Link2,
    Trash2,
} from 'lucide-react';

interface Transaction {
    id: number;
    date: string;
    payment_ref: string;
    partner_name?: string;
    amount: number;
    currency_code: string;
    running_balance?: number;
    is_reconciled: boolean;
    checked: boolean;
    bank_account?: { name: string };
    partner?: { name: string };
}

interface TransactionListProps {
    transactions: Transaction[];
    onSelect?: (ids: number[]) => void;
    onReconcile?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
    onViewDetails?: (transaction: Transaction) => void;
    showAccount?: boolean;
    selectable?: boolean;
}

export function TransactionList({
    transactions,
    onSelect,
    onReconcile,
    onDelete,
    onViewDetails,
    showAccount = false,
    selectable = true,
}: TransactionListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        onSelect?.(Array.from(newSelected));
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === transactions.length) {
            setSelectedIds(new Set());
            onSelect?.([]);
        } else {
            const allIds = new Set(transactions.map((t) => t.id));
            setSelectedIds(allIds);
            onSelect?.(Array.from(allIds));
        }
    };

    const filteredTransactions = transactions.filter((t) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            t.payment_ref?.toLowerCase().includes(search) ||
            t.partner_name?.toLowerCase().includes(search) ||
            t.partner?.name?.toLowerCase().includes(search)
        );
    });

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {selectable && (
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedIds.size === transactions.length && transactions.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                            )}
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Date</TableHead>
                            {showAccount && <TableHead>Account</TableHead>}
                            <TableHead>Description</TableHead>
                            <TableHead>Partner</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((transaction) => (
                            <TableRow
                                key={transaction.id}
                                className={selectedIds.has(transaction.id) ? 'bg-muted/50' : ''}
                            >
                                {selectable && (
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(transaction.id)}
                                            onCheckedChange={() => toggleSelect(transaction.id)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell>
                                    {transaction.amount >= 0 ? (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                        </div>
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                                </TableCell>
                                {showAccount && (
                                    <TableCell className="text-muted-foreground">
                                        {transaction.bank_account?.name}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className="max-w-[200px] truncate" title={transaction.payment_ref}>
                                        {transaction.payment_ref || 'No description'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {transaction.partner?.name || transaction.partner_name || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span
                                        className={
                                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                        }
                                    >
                                        {formatCurrency(transaction.amount, transaction.currency_code)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {transaction.running_balance !== undefined
                                        ? formatCurrency(transaction.running_balance, transaction.currency_code)
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    {transaction.is_reconciled ? (
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Reconciled
                                        </Badge>
                                    ) : transaction.checked ? (
                                        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
                                            <Circle className="mr-1 h-3 w-3" />
                                            Checked
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                                            <Circle className="mr-1 h-3 w-3" />
                                            Pending
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onViewDetails?.(transaction)}>
                                                View Details
                                            </DropdownMenuItem>
                                            {!transaction.is_reconciled && (
                                                <DropdownMenuItem onClick={() => onReconcile?.(transaction)}>
                                                    <Link2 className="mr-2 h-4 w-4" />
                                                    Reconcile
                                                </DropdownMenuItem>
                                            )}
                                            {!transaction.is_reconciled && (
                                                <DropdownMenuItem
                                                    onClick={() => onDelete?.(transaction)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={selectable ? 10 : 9}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default TransactionList;
