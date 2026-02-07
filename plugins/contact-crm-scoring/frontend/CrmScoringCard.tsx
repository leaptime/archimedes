import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Thermometer, Calendar, Activity, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CrmScoringCardProps {
    entity: Record<string, any>;
    onRefresh?: () => void;
}

export default function CrmScoringCard({ entity, onRefresh }: CrmScoringCardProps) {
    const crmData = entity.extension_data?.crm_scoring || {};
    const [recalculating, setRecalculating] = React.useState(false);

    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            await fetch(`/api/ext/contact-crm-scoring/contacts/${entity.id}/recalculate-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            onRefresh?.();
        } catch (error) {
            console.error('Failed to recalculate score:', error);
        } finally {
            setRecalculating(false);
        }
    };

    const temperatureConfig = {
        cold: { label: 'Cold', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        warm: { label: 'Warm', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        hot: { label: 'Hot', color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const temp = temperatureConfig[crmData.lead_temperature as keyof typeof temperatureConfig];
    const scoreColor = crmData.lead_score >= 70 
        ? 'text-green-600' 
        : crmData.lead_score >= 40 
            ? 'text-orange-600' 
            : 'text-muted-foreground';

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        CRM Scoring
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleRecalculate}
                        disabled={recalculating}
                    >
                        <RefreshCw className={`h-3 w-3 ${recalculating ? 'animate-spin' : ''}`} />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Lead Score */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Lead Score</span>
                        <span className={`font-semibold ${scoreColor}`}>
                            {crmData.lead_score ?? '-'}/100
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all ${
                                crmData.lead_score >= 70 
                                    ? 'bg-green-500' 
                                    : crmData.lead_score >= 40 
                                        ? 'bg-orange-500' 
                                        : 'bg-muted-foreground'
                            }`}
                            style={{ width: `${crmData.lead_score || 0}%` }}
                        />
                    </div>
                </div>

                {/* Temperature */}
                {temp && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Thermometer className="h-3 w-3" />
                            Temperature
                        </span>
                        <Badge variant="outline" className={temp.color}>
                            {temp.label}
                        </Badge>
                    </div>
                )}

                {/* Engagement Count */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Engagements
                    </span>
                    <span className="font-medium">
                        {crmData.engagement_count ?? 0}
                    </span>
                </div>

                {/* Last Engagement */}
                {crmData.last_engagement_date && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last Activity
                        </span>
                        <span className="text-xs">
                            {formatDistanceToNow(new Date(crmData.last_engagement_date), { addSuffix: true })}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
