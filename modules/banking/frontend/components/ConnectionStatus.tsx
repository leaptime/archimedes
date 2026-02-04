import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Landmark,
    RefreshCw,
    MoreHorizontal,
    CheckCircle2,
    AlertCircle,
    Clock,
    Unlink,
    Settings,
    Loader2,
} from 'lucide-react';

interface Connection {
    id: number;
    provider: string;
    institution_name: string;
    institution_logo?: string;
    status: string;
    display_status: string;
    is_active: boolean;
    is_expired: boolean;
    last_sync_at?: string;
    next_sync_at?: string;
    expires_at?: string;
    error_message?: string;
    sync_enabled: boolean;
}

interface ConnectionStatusProps {
    connection: Connection;
    onSync: (connectionId: number) => Promise<void>;
    onDisconnect: (connectionId: number) => Promise<void>;
    onToggleSync: (connectionId: number, enabled: boolean) => Promise<void>;
}

export function ConnectionStatus({
    connection,
    onSync,
    onDisconnect,
    onToggleSync,
}: ConnectionStatusProps) {
    const [syncing, setSyncing] = React.useState(false);
    const [disconnecting, setDisconnecting] = React.useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await onSync(connection.id);
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        try {
            await onDisconnect(connection.id);
        } finally {
            setDisconnecting(false);
        }
    };

    const getStatusBadge = () => {
        switch (connection.status) {
            case 'active':
                return (
                    <Badge className="bg-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Connected
                    </Badge>
                );
            case 'error':
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Error
                    </Badge>
                );
            case 'expired':
                return (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Expired
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{connection.display_status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {connection.institution_logo ? (
                            <img
                                src={connection.institution_logo}
                                alt={connection.institution_name}
                                className="h-10 w-10 rounded object-contain"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <Landmark className="h-5 w-5" />
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-base">{connection.institution_name}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">
                                via {connection.provider}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge()}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleSync} disabled={syncing || !connection.is_active}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Sync Now
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            onSelect={(e) => e.preventDefault()}
                                            className="text-destructive"
                                        >
                                            <Unlink className="mr-2 h-4 w-4" />
                                            Disconnect
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Disconnect Bank?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will stop automatic transaction sync from{' '}
                                                {connection.institution_name}. Your existing transactions
                                                will not be deleted.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDisconnect}
                                                className="bg-destructive text-destructive-foreground"
                                            >
                                                {disconnecting && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Disconnect
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {connection.error_message && (
                    <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {connection.error_message}
                    </div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                        {connection.last_sync_at && (
                            <p className="text-muted-foreground">
                                Last synced{' '}
                                {formatDistanceToNow(new Date(connection.last_sync_at), {
                                    addSuffix: true,
                                })}
                            </p>
                        )}
                        {connection.next_sync_at && connection.sync_enabled && (
                            <p className="text-muted-foreground">
                                Next sync{' '}
                                {formatDistanceToNow(new Date(connection.next_sync_at), {
                                    addSuffix: true,
                                })}
                            </p>
                        )}
                        {connection.expires_at && (
                            <p className="text-muted-foreground">
                                Access expires{' '}
                                {format(new Date(connection.expires_at), 'MMM d, yyyy')}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Auto-sync</span>
                        <Switch
                            checked={connection.sync_enabled}
                            onCheckedChange={(checked) => onToggleSync(connection.id, checked)}
                            disabled={!connection.is_active}
                        />
                    </div>
                </div>

                {connection.is_active && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sync Transactions
                    </Button>
                )}

                {connection.is_expired && (
                    <Button variant="default" size="sm" className="mt-3 w-full">
                        Reconnect Bank
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default ConnectionStatus;
