import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FolderKanban, Shield } from "lucide-react";
import { TeamStats } from "@/components/team/TeamStats";
import { TeamMembersList, TeamMember } from "@/components/team/TeamMembersList";
import { TeamGroups, TeamGroup } from "@/components/team/TeamGroups";
import { ModulePermissions } from "@/components/team/ModulePermissions";

const teamMembers: TeamMember[] = [
  { 
    id: 1, 
    name: "Alex Johnson", 
    email: "alex@company.com", 
    role: "Owner",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    status: "active",
    modules: ["All Modules"],
    groups: ["Leadership"]
  },
  { 
    id: 2, 
    name: "Sarah Chen", 
    email: "sarah@company.com", 
    role: "Admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    status: "active",
    modules: ["CRM 360", "Analytics Hub"],
    groups: ["Sales Team"]
  },
  { 
    id: 3, 
    name: "Mike Williams", 
    email: "mike@company.com", 
    role: "Member",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    status: "active",
    modules: ["Invoice Pro"],
    groups: ["Finance"]
  },
  { 
    id: 4, 
    name: "Emily Davis", 
    email: "emily@company.com", 
    role: "Member",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    status: "active",
    modules: ["CRM 360"],
    groups: ["Sales Team"]
  },
  { 
    id: 5, 
    name: "James Wilson", 
    email: "james@company.com", 
    role: "Member",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    status: "pending",
    modules: [],
    groups: []
  },
];

const teamGroups: TeamGroup[] = [
  {
    id: 1,
    name: "Sales Team",
    description: "Customer-facing sales representatives",
    color: "blue",
    memberIds: [2, 4],
    modules: ["CRM 360", "Analytics Hub"]
  },
  {
    id: 2,
    name: "Finance",
    description: "Accounting and financial operations",
    color: "green",
    memberIds: [3],
    modules: ["Invoice Pro", "Analytics Hub"]
  },
  {
    id: 3,
    name: "Leadership",
    description: "Executive team and managers",
    color: "purple",
    memberIds: [1],
    modules: ["All Modules"]
  },
];

const availableModules = [
  { id: "crm", name: "CRM 360", icon: "users" },
  { id: "analytics", name: "Analytics Hub", icon: "chart" },
  { id: "invoice", name: "Invoice Pro", icon: "file" },
  { id: "inventory", name: "Inventory Manager", icon: "package" },
  { id: "hr", name: "HR Suite", icon: "briefcase" },
];

const Team = () => {
  const [activeTab, setActiveTab] = useState("members");

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
            <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-background">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2 data-[state=active]:bg-background">
              <FolderKanban className="w-4 h-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2 data-[state=active]:bg-background">
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
              availableModules={availableModules.map(m => m.name)} 
            />
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <ModulePermissions 
              members={teamMembers} 
              groups={teamGroups} 
              availableModules={availableModules} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Team;
