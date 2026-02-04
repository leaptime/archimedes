import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FolderKanban, Shield } from 'lucide-react';
import { TeamStats, TeamMembersList, TeamGroups, teamMembers, teamGroups } from '@/components/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const availableModules = ['CRM 360', 'Analytics Hub', 'Invoice Pro', 'Inventory Manager', 'HR Suite'];

export default function Team() {
    const [activeTab, setActiveTab] = useState('members');

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Team"
                subtitle="Manage your team members, groups, and module permissions"
            />
            <div className="p-6 space-y-6">
                {/* Stats */}
                <TeamStats members={teamMembers} />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger
                            value="members"
                            className="gap-2 data-[state=active]:bg-background"
                        >
                            <Users className="w-4 h-4" />
                            Members
                        </TabsTrigger>
                        <TabsTrigger
                            value="groups"
                            className="gap-2 data-[state=active]:bg-background"
                        >
                            <FolderKanban className="w-4 h-4" />
                            Groups
                        </TabsTrigger>
                        <TabsTrigger
                            value="permissions"
                            className="gap-2 data-[state=active]:bg-background"
                        >
                            <Shield className="w-4 h-4" />
                            Permissions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="mt-6">
                        <TeamMembersList members={teamMembers} />
                    </TabsContent>

                    <TabsContent value="groups" className="mt-6">
                        <TeamGroups
                            groups={teamGroups}
                            members={teamMembers}
                            availableModules={availableModules}
                        />
                    </TabsContent>

                    <TabsContent value="permissions" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Module Permissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Configure which team members and groups have access to each module.
                                    Fine-grained permission matrix coming soon.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
