import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  Shield,
  Code,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileWarning,
  Settings2,
  Info
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Conflict {
  id: string;
  type: "breaking" | "warning" | "info";
  title: string;
  description: string;
  affectedFiles: string[];
  resolution: string;
}

interface ModuleUpdate {
  id: string;
  moduleName: string;
  currentVersion: string;
  newVersion: string;
  releaseDate: string;
  changes: string[];
  conflicts: Conflict[];
  customizations: string[];
  status: "pending" | "reviewing" | "approved" | "skipped";
}

const mockUpdates: ModuleUpdate[] = [
  {
    id: "update-1",
    moduleName: "Invoice Pro",
    currentVersion: "2.4.1",
    newVersion: "2.5.0",
    releaseDate: "2024-01-28",
    changes: [
      "New multi-currency support",
      "Improved PDF export engine",
      "Updated tax calculation API",
      "Performance optimizations"
    ],
    customizations: [
      "Custom invoice template (InvoiceTemplate.tsx)",
      "Tax override rules (TaxRules.config)",
      "Payment webhook integration"
    ],
    conflicts: [
      {
        id: "c1",
        type: "breaking",
        title: "Tax Calculation API Changed",
        description: "The tax calculation method signature has changed from calculateTax(amount, region) to calculateTax({ amount, region, currency }).",
        affectedFiles: ["TaxRules.config", "InvoiceCalculator.ts"],
        resolution: "Update your custom tax rules to use the new object-based parameter format."
      },
      {
        id: "c2",
        type: "warning",
        title: "Template Engine Update",
        description: "PDF export now uses a new rendering engine. Custom templates may need minor adjustments.",
        affectedFiles: ["InvoiceTemplate.tsx"],
        resolution: "Review your custom template and update any deprecated styling props."
      }
    ],
    status: "pending"
  },
  {
    id: "update-2",
    moduleName: "CRM 360",
    currentVersion: "3.1.0",
    newVersion: "3.2.0",
    releaseDate: "2024-01-27",
    changes: [
      "Enhanced lead scoring algorithm",
      "New email template builder",
      "Improved contact merge feature",
      "Bug fixes and stability improvements"
    ],
    customizations: [
      "Custom lead scoring weights",
      "Email template overrides",
      "Pipeline automation rules"
    ],
    conflicts: [
      {
        id: "c3",
        type: "info",
        title: "Lead Scoring Enhancement",
        description: "New scoring factors available. Your custom weights will be preserved but you may want to review new options.",
        affectedFiles: ["LeadScoringConfig.json"],
        resolution: "No action required. Optionally review new scoring factors in settings."
      }
    ],
    status: "pending"
  },
  {
    id: "update-3",
    moduleName: "Analytics Hub",
    currentVersion: "2.6.0",
    newVersion: "3.0.0",
    releaseDate: "2024-01-25",
    changes: [
      "Complete dashboard redesign",
      "New chart library (Chart.js → Recharts)",
      "Real-time data streaming",
      "Custom widget API v2"
    ],
    customizations: [
      "Custom KPI dashboard",
      "Revenue chart modifications",
      "Data export automation"
    ],
    conflicts: [
      {
        id: "c4",
        type: "breaking",
        title: "Chart Library Migration",
        description: "The charting library has been replaced. All custom chart configurations need to be migrated to the new format.",
        affectedFiles: ["CustomCharts.tsx", "KPIDashboard.tsx", "RevenueChart.tsx"],
        resolution: "Use the migration wizard to convert Chart.js configs to Recharts format."
      },
      {
        id: "c5",
        type: "breaking",
        title: "Widget API v2 Breaking Changes",
        description: "Custom widgets using API v1 will not work. The widget registration and lifecycle methods have changed.",
        affectedFiles: ["CustomWidgets.ts", "WidgetRegistry.ts"],
        resolution: "Refactor custom widgets to use the new useWidget hook and registration pattern."
      },
      {
        id: "c6",
        type: "warning",
        title: "Data Export Format Change",
        description: "Export automation scripts may need updates due to new data structure.",
        affectedFiles: ["ExportAutomation.ts"],
        resolution: "Review and update field mappings in your export scripts."
      }
    ],
    status: "pending"
  }
];

const Upgrades = () => {
  const [updates, setUpdates] = useState<ModuleUpdate[]>(mockUpdates);
  const [selectedUpdate, setSelectedUpdate] = useState<ModuleUpdate | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "skip" | null>(null);

  const getConflictIcon = (type: Conflict["type"]) => {
    switch (type) {
      case "breaking":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "info":
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getConflictBadge = (type: Conflict["type"]) => {
    switch (type) {
      case "breaking":
        return <Badge variant="destructive">Breaking</Badge>;
      case "warning":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Warning</Badge>;
      case "info":
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const getStatusBadge = (status: ModuleUpdate["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-muted">Pending Review</Badge>;
      case "reviewing":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Reviewing</Badge>;
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/30">Approved</Badge>;
      case "skipped":
        return <Badge variant="outline" className="text-muted-foreground">Skipped</Badge>;
    }
  };

  const getTotalConflicts = (update: ModuleUpdate) => {
    const breaking = update.conflicts.filter(c => c.type === "breaking").length;
    const warnings = update.conflicts.filter(c => c.type === "warning").length;
    return { breaking, warnings, total: update.conflicts.length };
  };

  const handleAction = (update: ModuleUpdate, action: "approve" | "skip") => {
    setSelectedUpdate(update);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const confirmUpdate = () => {
    if (selectedUpdate && confirmAction) {
      setUpdates(prev =>
        prev.map(u =>
          u.id === selectedUpdate.id
            ? { ...u, status: confirmAction === "approve" ? "approved" : "skipped" }
            : u
        )
      );
    }
    setShowConfirmDialog(false);
    setSelectedUpdate(null);
    setConfirmAction(null);
  };

  const pendingUpdates = updates.filter(u => u.status === "pending" || u.status === "reviewing");
  const processedUpdates = updates.filter(u => u.status === "approved" || u.status === "skipped");

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Upgrade Center"
        subtitle="Review updates and resolve conflicts with your customizations"
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Updates</p>
                <p className="text-2xl font-bold text-foreground">{pendingUpdates.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Breaking Conflicts</p>
                <p className="text-2xl font-bold text-destructive">
                  {pendingUpdates.reduce((acc, u) => acc + getTotalConflicts(u).breaking, 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-warning">
                  {pendingUpdates.reduce((acc, u) => acc + getTotalConflicts(u).warnings, 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customizations</p>
                <p className="text-2xl font-bold text-foreground">
                  {updates.reduce((acc, u) => acc + u.customizations.length, 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pending Updates */}
        {pendingUpdates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Pending Updates
            </h2>

            <div className="space-y-4">
              {pendingUpdates.map((update, index) => {
                const conflicts = getTotalConflicts(update);
                return (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={conflicts.breaking > 0 ? "border-destructive/30" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-lg">
                                {update.moduleName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <CardTitle className="text-lg">{update.moduleName}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  v{update.currentVersion}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                                  v{update.newVersion}
                                </Badge>
                                {getStatusBadge(update.status)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {conflicts.breaking > 0 && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                {conflicts.breaking} Breaking
                              </Badge>
                            )}
                            {conflicts.warnings > 0 && (
                              <Badge className="gap-1 bg-warning/10 text-warning border-warning/30">
                                <AlertTriangle className="w-3 h-3" />
                                {conflicts.warnings} Warnings
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* What's New */}
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            What's New
                          </h4>
                          <ul className="grid grid-cols-2 gap-1">
                            {update.changes.map((change, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Your Customizations */}
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-muted-foreground" />
                            Your Customizations ({update.customizations.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {update.customizations.map((custom, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {custom}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Conflicts */}
                        {update.conflicts.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <FileWarning className="w-4 h-4 text-warning" />
                              Detected Conflicts ({update.conflicts.length})
                            </h4>

                            <Accordion type="single" collapsible className="space-y-2">
                              {update.conflicts.map((conflict) => (
                                <AccordionItem
                                  key={conflict.id}
                                  value={conflict.id}
                                  className="border rounded-lg px-4"
                                >
                                  <AccordionTrigger className="hover:no-underline py-3">
                                    <div className="flex items-center gap-3">
                                      {getConflictIcon(conflict.type)}
                                      <span className="text-sm font-medium">{conflict.title}</span>
                                      {getConflictBadge(conflict.type)}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-4">
                                    <div className="space-y-3 pl-8">
                                      <p className="text-sm text-muted-foreground">
                                        {conflict.description}
                                      </p>

                                      <div>
                                        <p className="text-xs font-medium text-foreground mb-1">
                                          Affected Files:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {conflict.affectedFiles.map((file, i) => (
                                            <Badge
                                              key={i}
                                              variant="outline"
                                              className="text-xs font-mono bg-muted"
                                            >
                                              <Code className="w-3 h-3 mr-1" />
                                              {file}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                        <p className="text-xs font-medium text-primary mb-1">
                                          Recommended Resolution:
                                        </p>
                                        <p className="text-sm text-foreground">
                                          {conflict.resolution}
                                        </p>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                          <Button
                            variant="outline"
                            onClick={() => handleAction(update, "skip")}
                          >
                            Skip Update
                          </Button>
                          <Button
                            onClick={() => handleAction(update, "approve")}
                            className={conflicts.breaking > 0 ? "bg-warning hover:bg-warning/90" : ""}
                          >
                            {conflicts.breaking > 0 ? "Proceed with Caution" : "Apply Update"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Processed Updates */}
        {processedUpdates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              Recently Processed
            </h2>

            <div className="space-y-2">
              {processedUpdates.map((update) => (
                <Card key={update.id} className="bg-muted/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground font-semibold">
                          {update.moduleName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{update.moduleName}</p>
                        <p className="text-sm text-muted-foreground">
                          v{update.currentVersion} → v{update.newVersion}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(update.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pendingUpdates.length === 0 && processedUpdates.length === 0 && (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">All Up to Date!</h3>
            <p className="text-muted-foreground">
              Your modules are current and there are no pending updates.
            </p>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "approve" ? "Confirm Update" : "Skip Update"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "approve" ? (
                selectedUpdate && getTotalConflicts(selectedUpdate).breaking > 0 ? (
                  <span className="text-warning">
                    This update has breaking changes that may affect your customizations.
                    Make sure you've reviewed the conflicts and have a plan to resolve them.
                  </span>
                ) : (
                  "This update will be applied to your module. Your customizations will be preserved."
                )
              ) : (
                "Skipping this update means you'll continue using the current version. You can always apply it later from the upgrade center."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmUpdate}
              variant={confirmAction === "skip" ? "outline" : "default"}
              className={
                confirmAction === "approve" &&
                selectedUpdate &&
                getTotalConflicts(selectedUpdate).breaking > 0
                  ? "bg-warning hover:bg-warning/90"
                  : ""
              }
            >
              {confirmAction === "approve" ? "Apply Update" : "Skip Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Upgrades;
