import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, ArrowRight, Shield, AlertTriangle, 
  Bug, Info, Calendar, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

const chartData = [
  { day: "Monday", internal: 28, external: 22 },
  { day: "Tuesday", internal: 32, external: 28 },
  { day: "Wednesday", internal: 35, external: 42 },
  { day: "Thursday", internal: 68, external: 56 },
  { day: "Friday", internal: 45, external: 38 },
  { day: "Saturday", internal: 52, external: 45 },
  { day: "Sunday", internal: 38, external: 35 },
];

const tabs = ["Overview", "Modules", "Activity", "System"];

const statCards = [
  {
    title: "Active Modules",
    value: "85/100",
    change: "+10.5%",
    changeType: "positive" as const,
    subtitle: "5 added (last 30 days)",
    icon: Shield,
    action: "View details",
  },
  {
    title: "API Calls",
    value: "12",
    badge: "1 Critical, 2 High",
    badgeType: "warning" as const,
    icon: AlertTriangle,
    action: "Analyze calls",
  },
  {
    title: "Critical Issues",
    value: "16",
    change: "+10.5%",
    changeType: "positive" as const,
    icon: Info,
    action: "See list of issues",
  },
];

const overviewItems = [
  { label: "Platform Modules", value: "12", color: "bg-primary" },
  { label: "Third Party", value: "8", color: "bg-orange-500" },
  { label: "Custom Built", value: "4", color: "bg-emerald-500" },
  { label: "Pending Updates", value: "3", color: "bg-amber-500" },
];

const securityEvents = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 78 },
  { day: "Wed", value: 82 },
  { day: "Thu", value: 70 },
  { day: "Fri", value: 85 },
  { day: "Sat", value: 72 },
];

export function DashboardHome() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [chartPeriod, setChartPeriod] = useState("Daily");
  
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-foreground font-medium">Overview</span>
        </div>
      </div>

      {/* Page Title */}
      <div className="px-8 pb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Overview</h1>
        <Button variant="outline" className="gap-2 h-9">
          <Calendar className="w-4 h-4" />
          <span>Sep 7, 2024</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-8 mb-6">
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                activeTab === tab 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm text-muted-foreground">{card.title}</span>
                <card.icon className="w-5 h-5 text-muted-foreground/50" />
              </div>
              
              <div className="flex items-end gap-3 mb-1">
                <span className="text-4xl font-semibold text-foreground tracking-tight">
                  {card.value}
                </span>
                {card.change && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-sm font-medium px-2 py-0.5 rounded-full mb-1",
                    card.changeType === "positive" 
                      ? "text-emerald-600 bg-emerald-50" 
                      : "text-red-600 bg-red-50"
                  )}>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {card.change}
                  </span>
                )}
                {card.badge && (
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full mb-1",
                    card.badgeType === "warning" 
                      ? "text-red-600 bg-red-50 border border-red-200" 
                      : "text-muted-foreground bg-muted"
                  )}>
                    {card.badge}
                  </span>
                )}
              </div>
              
              {card.subtitle && (
                <p className="text-sm text-muted-foreground mb-4">{card.subtitle}</p>
              )}
              
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group mt-2">
                {card.action}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Module Activity Trend</h3>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {["Daily", "Monthly", "Yearly"].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    chartPeriod === period
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInternal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExternal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="4 4" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="internal"
                  stroke="hsl(200, 80%, 50%)"
                  strokeWidth={2}
                  fill="url(#colorInternal)"
                  name="Platform Modules"
                  dot={{ fill: 'hsl(200, 80%, 50%)', strokeWidth: 0, r: 0 }}
                  activeDot={{ fill: 'hsl(200, 80%, 50%)', strokeWidth: 2, stroke: 'white', r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="external"
                  stroke="hsl(25, 95%, 55%)"
                  strokeWidth={2}
                  fill="url(#colorExternal)"
                  name="Third Party"
                  dot={{ fill: 'hsl(25, 95%, 55%)', strokeWidth: 0, r: 0 }}
                  activeDot={{ fill: 'hsl(25, 95%, 55%)', strokeWidth: 2, stroke: 'white', r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(200,80%,50%)]" />
              <span className="text-sm text-muted-foreground">Platform Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(25,95%,55%)]" />
              <span className="text-sm text-muted-foreground">Third Party</span>
            </div>
          </div>
        </motion.div>

        {/* Side Cards */}
        <div className="space-y-4">
          {/* Mini Chart Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h4 className="text-sm font-medium text-foreground mb-4">System Events</h4>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={securityEvents}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorEvents)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-2xl font-semibold text-foreground">452</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                +12.3%
              </span>
            </div>
          </motion.div>

          {/* Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-foreground">Quick Overview</h4>
              <button className="text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {overviewItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
