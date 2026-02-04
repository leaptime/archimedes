import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Send,
    RefreshCw,
    FileText,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Loader2,
    Eye,
} from 'lucide-react';

interface FatturaPaPanelProps {
    invoiceId: number;
    invoiceState: string;
    ediState?: string;
    ediError?: string;
    ediSentAt?: string;
    ediReceivedAt?: string;
}

interface Attachment {
    id: number;
    type: string;
    filename: string;
    sdi_identifier?: string;
    created_at: string;
}

interface LogEntry {
    id: number;
    action: string;
    status: string;
    error_message?: string;
    created_at: string;
}

const STATE_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    being_sent: { label: 'Invio in corso', color: 'blue', icon: Clock },
    processing: { label: 'In elaborazione SDI', color: 'blue', icon: Clock },
    forward_attempt: { label: 'Tentativo di consegna', color: 'blue', icon: Clock },
    requires_user_signature: { label: 'Richiede firma', color: 'yellow', icon: AlertCircle },
    rejected: { label: 'Scartato da SDI', color: 'red', icon: XCircle },
    forward_failed: { label: 'Mancata consegna', color: 'red', icon: XCircle },
    rejected_by_pa_partner: { label: 'Rifiutato dalla PA', color: 'red', icon: XCircle },
    forwarded: { label: 'Consegnato', color: 'green', icon: CheckCircle2 },
    accepted_by_pa_partner: { label: 'Accettato dalla PA', color: 'green', icon: CheckCircle2 },
    accepted_by_pa_partner_after_expiry: { label: 'Decorrenza termini', color: 'green', icon: CheckCircle2 },
};

export default function FatturaPaPanel({
    invoiceId,
    invoiceState,
    ediState,
    ediError,
    ediSentAt,
    ediReceivedAt,
}: FatturaPaPanelProps) {
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; can_send: boolean } | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showXmlPreview, setShowXmlPreview] = useState(false);
    const [xmlContent, setXmlContent] = useState<string | null>(null);
    const [currentState, setCurrentState] = useState(ediState);
    const [currentError, setCurrentError] = useState(ediError);

    useEffect(() => {
        if (ediState) {
            loadAttachments();
            loadLogs();
        }
    }, [invoiceId, ediState]);

    const loadAttachments = async () => {
        try {
            const response = await fetch(`/api/l10n-it-edi/invoices/${invoiceId}/attachments`);
            const data = await response.json();
            setAttachments(data.data || []);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const response = await fetch(`/api/l10n-it-edi/invoices/${invoiceId}/logs`);
            const data = await response.json();
            setLogs(data.data || []);
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    };

    const handleValidate = async () => {
        setValidating(true);
        try {
            const response = await fetch(`/api/l10n-it-edi/invoices/${invoiceId}/validate`);
            const data = await response.json();
            setValidation(data);
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setValidating(false);
        }
    };

    const handleSend = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/l10n-it-edi/invoices/${invoiceId}/send`, {
                method: 'POST',
            });
            const data = await response.json();
            
            if (data.success) {
                setCurrentState(data.data.state);
                loadAttachments();
                loadLogs();
            } else {
                setCurrentError(data.errors?.join(', ') || 'Errore durante l\'invio');
            }
        } catch (error) {
            console.error('Send failed:', error);
            setCurrentError('Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/l10n-it-edi/invoices/${invoiceId}/refresh`, {
                method: 'POST',
            });
            const data = await response.json();
            
            if (data.success) {
                setCurrentState(data.data.state);
                loadAttachments();
                loadLogs();
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewXml = async () => {
        try {
            const response = await fetch(`/api/l10n-it-edi/invoices/${invoiceId}/preview`);
            const data = await response.json();
            
            if (data.success) {
                setXmlContent(data.xml);
                setShowXmlPreview(true);
            }
        } catch (error) {
            console.error('Preview failed:', error);
        }
    };

    const handleDownloadAttachment = (attachmentId: number, filename: string) => {
        window.open(`/api/l10n-it-edi/attachments/${attachmentId}/download`, '_blank');
    };

    const stateConfig = currentState ? STATE_CONFIG[currentState] : null;
    const StateIcon = stateConfig?.icon || Clock;
    const canSend = invoiceState === 'posted' && (!currentState || currentState === 'rejected');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Fatturazione Elettronica (SDI)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current State */}
                {currentState && stateConfig && (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <StateIcon className={`h-5 w-5 text-${stateConfig.color}-500`} />
                            <div>
                                <p className="font-medium">{stateConfig.label}</p>
                                {ediSentAt && (
                                    <p className="text-sm text-muted-foreground">
                                        Inviato: {new Date(ediSentAt).toLocaleString('it-IT')}
                                    </p>
                                )}
                                {ediReceivedAt && (
                                    <p className="text-sm text-muted-foreground">
                                        Ricevuto: {new Date(ediReceivedAt).toLocaleString('it-IT')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge
                            variant={stateConfig.color === 'green' ? 'default' : stateConfig.color === 'red' ? 'destructive' : 'secondary'}
                        >
                            {stateConfig.label}
                        </Badge>
                    </div>
                )}

                {/* Error Display */}
                {currentError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2 text-red-800">
                            <XCircle className="h-4 w-4" />
                            <p className="text-sm font-medium">Errore</p>
                        </div>
                        <p className="mt-1 text-sm text-red-700">{currentError}</p>
                    </div>
                )}

                {/* Validation Result */}
                {validation && (
                    <div className={`rounded-lg border p-3 ${validation.valid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                        <div className="flex items-center gap-2">
                            {validation.valid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <p className={`text-sm font-medium ${validation.valid ? 'text-green-800' : 'text-yellow-800'}`}>
                                {validation.valid ? 'Fattura valida per l\'invio' : 'Problemi da risolvere'}
                            </p>
                        </div>
                        {!validation.valid && validation.errors.length > 0 && (
                            <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
                                {validation.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    {canSend && (
                        <>
                            <Button variant="outline" onClick={handleValidate} disabled={validating}>
                                {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Valida
                            </Button>
                            <Button onClick={handleSend} disabled={loading || (validation && !validation.can_send)}>
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Invia a SDI
                            </Button>
                        </>
                    )}
                    {currentState && !['rejected'].includes(currentState) && (
                        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Aggiorna stato
                        </Button>
                    )}
                    <Button variant="outline" onClick={handlePreviewXml}>
                        <Eye className="mr-2 h-4 w-4" />
                        Anteprima XML
                    </Button>
                </div>

                {/* Attachments & Logs */}
                {(attachments.length > 0 || logs.length > 0) && (
                    <Accordion type="single" collapsible className="w-full">
                        {attachments.length > 0 && (
                            <AccordionItem value="attachments">
                                <AccordionTrigger>
                                    Allegati ({attachments.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        {attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center justify-between rounded border p-2"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{attachment.filename}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {attachment.type} • {new Date(attachment.created_at).toLocaleString('it-IT')}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {logs.length > 0 && (
                            <AccordionItem value="logs">
                                <AccordionTrigger>
                                    Log attività ({logs.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {logs.map((log) => (
                                            <div
                                                key={log.id}
                                                className={`rounded border p-2 text-sm ${
                                                    log.status === 'error' ? 'border-red-200 bg-red-50' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{log.action}</span>
                                                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                                                        {log.status}
                                                    </Badge>
                                                </div>
                                                {log.error_message && (
                                                    <p className="mt-1 text-xs text-red-700">{log.error_message}</p>
                                                )}
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {new Date(log.created_at).toLocaleString('it-IT')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                )}
            </CardContent>

            {/* XML Preview Dialog */}
            <Dialog open={showXmlPreview} onOpenChange={setShowXmlPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Anteprima FatturaPA XML</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[60vh]">
                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                            {xmlContent}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
