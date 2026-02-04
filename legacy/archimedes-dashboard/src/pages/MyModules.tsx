import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { mockModules } from "@/data/modules";
import { ModuleCard } from "@/components/ModuleCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Power, RefreshCw, ExternalLink } from "lucide-react";

const MyModules = () => {
  const installedModules = mockModules.filter(m => m.status === "installed");

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="My Modules" 
        subtitle="Manage your installed modules"
      />
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <p className="text-sm text-muted-foreground mb-1">Active Modules</p>
            <p className="text-3xl font-bold text-foreground">{installedModules.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
            <p className="text-3xl font-bold text-foreground">$137</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <p className="text-sm text-muted-foreground mb-1">Updates Available</p>
            <p className="text-3xl font-bold text-warning">2</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <p className="text-sm text-muted-foreground mb-1">API Calls Today</p>
            <p className="text-3xl font-bold text-foreground">12.4k</p>
          </motion.div>
        </div>

        {/* Installed Modules List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Installed Modules</h2>
          
          <div className="space-y-3">
            {installedModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {module.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{module.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                        Active
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{module.version}</span>
                      {module.provider === "platform" && (
                        <Badge variant="outline" className="text-xs">Official</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Power className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyModules;
