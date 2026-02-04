import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Activity, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart, LineChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartPie, Pie, Cell
} from "recharts";
import { cn } from "@/lib/utils";

const areaData = [
  { name: "Jan", calls: 4000, cost: 80 },
  { name: "Feb", calls: 3000, cost: 95 },
  { name: "Mar", calls: 5000, cost: 110 },
  { name: "Apr", calls: 4500, cost: 105 },
  { name: "May", calls: 6000, cost: 125 },
  { name: "Jun", calls: 5500, cost: 137 },
];

const barData = [
  { name: "Invoice Pro", usage: 4500 },
  { name: "CRM 360", usage: 3800 },
  { name: "Analytics Hub", usage: 4100 },
];

const pieData = [
  { name: "Invoice Pro", value: 35, color: "hsl(162, 63%, 41%)" },
  { name: "CRM 360", value: 30, color: "hsl(250, 60%, 60%)" },
  { name: "Analytics Hub", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "Other", value: 10, color: "hsl(220, 14%, 80%)" },
];

const Analytics = () => {
  return (
    <DashboardLayout>
      <DashboardHeader 
        title="Analytics" 
        subtitle="Track your module usage and performance"
      />
      <div className="p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <Tabs defaultValue="overview" className="w-auto">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select defaultValue="30d">
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total API Calls</span>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">284.5k</p>
            <div className="flex items-center gap-1 text-sm text-success">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Avg Response Time</span>
              <LineChart className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">142ms</p>
            <div className="flex items-center gap-1 text-sm text-success">
              <ArrowDownRight className="w-4 h-4" />
              <span>-8.3%</span>
              <span className="text-muted-foreground">faster</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">1,284</p>
            <div className="flex items-center gap-1 text-sm text-success">
              <ArrowUpRight className="w-4 h-4" />
              <span>+22.1%</span>
              <span className="text-muted-foreground">growth</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">$137</p>
            <div className="flex items-center gap-1 text-sm text-destructive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+5.2%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">API Usage Over Time</h3>
                <p className="text-sm text-muted-foreground">Monthly API calls trend</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                Growing
              </Badge>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(162, 63%, 41%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(162, 63%, 41%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="hsl(162, 63%, 41%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCalls)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="mb-6">
              <h3 className="font-semibold text-foreground">Usage Distribution</h3>
              <p className="text-sm text-muted-foreground">By module</p>
            </div>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartPie>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Module Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Module Performance</h3>
              <p className="text-sm text-muted-foreground">API calls per module this month</p>
            </div>
            <Button variant="outline" size="sm">
              Export Report
            </Button>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis type="number" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(220, 10%, 50%)" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="usage" fill="hsl(162, 63%, 41%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
