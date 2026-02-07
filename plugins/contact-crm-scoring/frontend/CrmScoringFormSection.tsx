import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Thermometer, Calendar, Activity } from 'lucide-react';

interface CrmScoringFormSectionProps {
    data: Record<string, any>;
    setData: (data: any) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
}

export default function CrmScoringFormSection({ 
    data, 
    setData, 
    errors = {}, 
    disabled = false 
}: CrmScoringFormSectionProps) {
    const extensionData = data.extension_data?.crm_scoring || {};

    const updateField = (field: string, value: any) => {
        setData({
            ...data,
            extension_data: {
                ...data.extension_data,
                crm_scoring: {
                    ...extensionData,
                    [field]: value,
                },
            },
        });
    };

    const temperatureColors = {
        cold: 'text-blue-500',
        warm: 'text-orange-500',
        hot: 'text-red-500',
    };

    return (
        <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                CRM Scoring
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead Score */}
                <div className="space-y-2">
                    <Label htmlFor="lead_score" className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        Lead Score
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="lead_score"
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0-100"
                            value={extensionData.lead_score || ''}
                            onChange={(e) => updateField('lead_score', parseInt(e.target.value) || null)}
                            disabled={disabled}
                            className="w-24"
                        />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${extensionData.lead_score || 0}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Score from 0-100 based on engagement
                    </p>
                </div>

                {/* Lead Temperature */}
                <div className="space-y-2">
                    <Label htmlFor="lead_temperature" className="flex items-center gap-2">
                        <Thermometer className="h-3 w-3" />
                        Lead Temperature
                    </Label>
                    <Select
                        value={extensionData.lead_temperature || ''}
                        onValueChange={(value) => updateField('lead_temperature', value)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select temperature" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cold">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    Cold
                                </span>
                            </SelectItem>
                            <SelectItem value="warm">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                    Warm
                                </span>
                            </SelectItem>
                            <SelectItem value="hot">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    Hot
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Last Engagement Date */}
                <div className="space-y-2">
                    <Label htmlFor="last_engagement_date" className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Last Engagement
                    </Label>
                    <Input
                        id="last_engagement_date"
                        type="date"
                        value={extensionData.last_engagement_date || ''}
                        onChange={(e) => updateField('last_engagement_date', e.target.value)}
                        disabled={disabled}
                    />
                </div>

                {/* Engagement Count */}
                <div className="space-y-2">
                    <Label htmlFor="engagement_count" className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Engagement Count
                    </Label>
                    <Input
                        id="engagement_count"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={extensionData.engagement_count || ''}
                        onChange={(e) => updateField('engagement_count', parseInt(e.target.value) || null)}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}
