import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, Users, User, ChevronDown, ChevronRight, 
  Check, X, Eye, Edit, Settings, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMember } from "./TeamMembersList";
import { TeamGroup } from "./TeamGroups";

interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleIcon: string;
  permissions: {
    entityType: "user" | "group";
    entityId: number;
    entityName: string;
    access: "none" | "view" | "edit" | "admin";
  }[];
}

interface ModulePermissionsProps {
  members: TeamMember[];
  groups: TeamGroup[];
  availableModules: { id: string; name: string; icon: string }[];
}

export const ModulePermissions = ({ members, groups, availableModules }: ModulePermissionsProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"by-module" | "by-user">("by-module");

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getAccessBadge = (access: string) => {
    switch (access) {
      case "admin":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        );
      case "edit":
        return (
          <Badge className="bg-success/10 text-success border-success/30 gap-1">
            <Edit className="w-3 h-3" />
            Edit
          </Badge>
        );
      case "view":
        return (
          <Badge variant="secondary" className="gap-1">
            <Eye className="w-3 h-3" />
            View
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <X className="w-3 h-3" />
            No Access
          </Badge>
        );
    }
  };

  // Sample permission data - in real app this would come from props/API
  const samplePermissions: ModulePermission[] = availableModules.map(mod => ({
    moduleId: mod.id,
    moduleName: mod.name,
    moduleIcon: mod.icon,
    permissions: [
      ...groups.map(g => ({
        entityType: "group" as const,
        entityId: g.id,
        entityName: g.name,
        access: g.modules.includes(mod.name) ? "edit" as const : "none" as const,
      })),
      ...members.slice(0, 3).map(m => ({
        entityType: "user" as const,
        entityId: m.id,
        entityName: m.name,
        access: m.modules.includes(mod.name) || m.modules.includes("All Modules") 
          ? (m.role === "Owner" ? "admin" as const : "edit" as const) 
          : "none" as const,
      })),
    ],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Module Permissions</h3>
          <p className="text-sm text-muted-foreground">Control access levels for each module</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(v: "by-module" | "by-user") => setViewMode(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="by-module">
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  By Module
                </span>
              </SelectItem>
              <SelectItem value="by-user">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  By User
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Permission Matrix - By Module View */}
      {viewMode === "by-module" && (
        <div className="space-y-3">
          {samplePermissions.map((module, index) => (
            <motion.div
              key={module.moduleId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Collapsible
                open={expandedModules.includes(module.moduleId)}
                onOpenChange={() => toggleModule(module.moduleId)}
              >
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-foreground">{module.moduleName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {module.permissions.filter(p => p.access !== "none").length} users/groups with access
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex gap-1">
                          {module.permissions.filter(p => p.access !== "none").slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {p.entityName}
                            </Badge>
                          ))}
                        </div>
                        {expandedModules.includes(module.moduleId) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border divide-y divide-border">
                      {/* Groups Section */}
                      {module.permissions.filter(p => p.entityType === "group").length > 0 && (
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Groups</span>
                          </div>
                          <div className="space-y-2">
                            {module.permissions
                              .filter(p => p.entityType === "group")
                              .map((perm) => (
                                <div
                                  key={`group-${perm.entityId}`}
                                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/20"
                                >
                                  <span className="text-sm">{perm.entityName}</span>
                                  <Select defaultValue={perm.access}>
                                    <SelectTrigger className="w-32 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Access</SelectItem>
                                      <SelectItem value="view">View Only</SelectItem>
                                      <SelectItem value="edit">Edit</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Individual Users Section */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Individual Users</span>
                        </div>
                        <div className="space-y-2">
                          {module.permissions
                            .filter(p => p.entityType === "user")
                            .map((perm) => (
                              <div
                                key={`user-${perm.entityId}`}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/20"
                              >
                                <span className="text-sm">{perm.entityName}</span>
                                <Select defaultValue={perm.access}>
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Access</SelectItem>
                                    <SelectItem value="view">View Only</SelectItem>
                                    <SelectItem value="edit">Edit</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      )}

      {/* Permission Matrix - By User View */}
      {viewMode === "by-user" && (
        <div className="space-y-3">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Collapsible
                open={expandedModules.includes(`user-${member.id}`)}
                onOpenChange={() => toggleModule(`user-${member.id}`)}
              >
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="text-left">
                          <h4 className="font-medium text-foreground">{member.name}</h4>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {member.modules.length === 1 && member.modules[0] === "All Modules" 
                            ? "All Modules" 
                            : `${member.modules.length} modules`}
                        </Badge>
                        {expandedModules.includes(`user-${member.id}`) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableModules.map((mod) => {
                          const hasAccess = member.modules.includes(mod.name) || member.modules.includes("All Modules");
                          return (
                            <div
                              key={mod.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{mod.name}</span>
                              </div>
                              <Switch checked={hasAccess} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-muted/30 rounded-xl border border-border p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Bulk Permission Updates</p>
              <p className="text-xs text-muted-foreground">Apply permission changes to multiple users or modules at once</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Configure
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
