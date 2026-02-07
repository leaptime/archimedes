import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
    Plus, Phone, Mail, Users, CheckSquare, Clock, 
    Check, MoreVertical, Calendar, AlertCircle 
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Activity {
    id: number;
    type: string;
    title: string;
    description?: string;
    scheduled_at?: string;
    completed_at?: string;
    user: { name: string };
    created_at: string;
}

interface ActivitiesTabProps {
    entity: { id: number };
    tabId: string;
    tabLabel: string;
}

const activityIcons = {
    call: Phone,
    email: Mail,
    meeting: Users,
    task: CheckSquare,
    deadline: Clock,
};

const activityColors = {
    call: 'bg-blue-100 text-blue-800',
    email: 'bg-green-100 text-green-800',
    meeting: 'bg-purple-100 text-purple-800',
    task: 'bg-orange-100 text-orange-800',
    deadline: 'bg-red-100 text-red-800',
};

export default function ActivitiesTab({ entity }: ActivitiesTabProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'task',
        title: '',
        description: '',
        scheduled_at: '',
    });

    const fetchActivities = async () => {
        try {
            const response = await fetch(`/api/ext/contact-activities/contacts/${entity.id}/activities`);
            const data = await response.json();
            setActivities(data.data || []);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [entity.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch(`/api/ext/contact-activities/contacts/${entity.id}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setShowForm(false);
            setFormData({ type: 'task', title: '', description: '', scheduled_at: '' });
            fetchActivities();
        } catch (error) {
            console.error('Failed to create activity:', error);
        }
    };

    const handleComplete = async (activityId: number) => {
        try {
            await fetch(`/api/ext/contact-activities/activities/${activityId}/complete`, {
                method: 'POST',
            });
            fetchActivities();
        } catch (error) {
            console.error('Failed to complete activity:', error);
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground">Loading activities...</div>;
    }

    const upcoming = activities.filter(a => !a.completed_at && a.scheduled_at && new Date(a.scheduled_at) >= new Date());
    const overdue = activities.filter(a => !a.completed_at && a.scheduled_at && new Date(a.scheduled_at) < new Date());
    const completed = activities.filter(a => a.completed_at);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Activities</h3>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Activity
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Activity</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Activity type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="call">Phone Call</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="task">Task</SelectItem>
                                        <SelectItem value="deadline">Deadline</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input
                                placeholder="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <Textarea
                                placeholder="Description (optional)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <Input
                                type="datetime-local"
                                value={formData.scheduled_at}
                                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Overdue */}
            {overdue.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Overdue ({overdue.length})
                    </h4>
                    <div className="space-y-2">
                        {overdue.map((activity) => (
                            <ActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                onComplete={() => handleComplete(activity.id)} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Upcoming ({upcoming.length})
                    </h4>
                    <div className="space-y-2">
                        {upcoming.map((activity) => (
                            <ActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                onComplete={() => handleComplete(activity.id)} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Completed ({completed.length})
                    </h4>
                    <div className="space-y-2">
                        {completed.map((activity) => (
                            <ActivityCard key={activity.id} activity={activity} />
                        ))}
                    </div>
                </div>
            )}

            {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No activities yet. Create one to get started.
                </div>
            )}
        </div>
    );
}

function ActivityCard({ activity, onComplete }: { activity: Activity; onComplete?: () => void }) {
    const Icon = activityIcons[activity.type as keyof typeof activityIcons] || CheckSquare;
    const colorClass = activityColors[activity.type as keyof typeof activityColors] || 'bg-gray-100 text-gray-800';
    const isCompleted = !!activity.completed_at;
    const isOverdue = !isCompleted && activity.scheduled_at && new Date(activity.scheduled_at) < new Date();

    return (
        <Card className={`${isCompleted ? 'opacity-60' : ''} ${isOverdue ? 'border-red-200' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                                {activity.title}
                            </span>
                            {isOverdue && (
                                <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                        </div>
                        {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {activity.scheduled_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(activity.scheduled_at), 'MMM d, yyyy h:mm a')}
                                </span>
                            )}
                            <span>by {activity.user.name}</span>
                        </div>
                    </div>
                    {!isCompleted && onComplete && (
                        <Button variant="ghost" size="icon" onClick={onComplete}>
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
