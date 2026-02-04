import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModuleCard } from "./ModuleCard";
import { mockModules } from "@/data/modules";
import { ModuleCategory, ModuleProvider, ModuleStatus, CATEGORY_LABELS } from "@/types/module";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type FilterType = "all" | ModuleCategory;
type ProviderFilter = "all" | ModuleProvider;
type StatusFilter = "all" | ModuleStatus;

export function ModuleCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FilterType>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredModules = mockModules.filter((module) => {
    const matchesSearch = 
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || module.category === categoryFilter;
    const matchesProvider = providerFilter === "all" || module.provider === providerFilter;
    const matchesStatus = statusFilter === "all" || module.status === statusFilter;

    return matchesSearch && matchesCategory && matchesProvider && matchesStatus;
  });

  const installedCount = mockModules.filter(m => m.status === "installed").length;
  const availableCount = mockModules.filter(m => m.status === "available").length;

  return (
    <div className="p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <p className="text-sm text-muted-foreground mb-1">Installed Modules</p>
          <p className="text-3xl font-bold text-foreground">{installedCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <p className="text-sm text-muted-foreground mb-1">Available Modules</p>
          <p className="text-3xl font-bold text-foreground">{availableCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <p className="text-sm text-muted-foreground mb-1">Total Categories</p>
          <p className="text-3xl font-bold text-foreground">{Object.keys(CATEGORY_LABELS).length}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FilterType)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v as ProviderFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="platform">Official</SelectItem>
              <SelectItem value="third-party">Third Party</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="installed">Installed</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="coming-soon">Coming Soon</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(categoryFilter !== "all" || providerFilter !== "all" || statusFilter !== "all") && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCategoryFilter("all")}>
              {CATEGORY_LABELS[categoryFilter as ModuleCategory]}
              <span className="ml-1">×</span>
            </Badge>
          )}
          {providerFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setProviderFilter("all")}>
              {providerFilter === "platform" ? "Official" : "Third Party"}
              <span className="ml-1">×</span>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setStatusFilter("all")}>
              {statusFilter === "installed" ? "Installed" : statusFilter === "available" ? "Available" : "Coming Soon"}
              <span className="ml-1">×</span>
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredModules.length} of {mockModules.length} modules
      </p>

      {/* Module Grid */}
      <div className={cn(
        "grid gap-5",
        viewMode === "grid" 
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
          : "grid-cols-1"
      )}>
        {filteredModules.map((module, index) => (
          <ModuleCard key={module.id} module={module} index={index} />
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No modules found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
