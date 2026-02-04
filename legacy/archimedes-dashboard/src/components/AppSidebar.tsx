import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Boxes,
  BarChart3,
  Users,
  Wand2,
  ArrowUpCircle,
  Shield,
  Network,
  FolderOpen,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard,
    hasSubmenu: true,
    submenu: [
      { title: "Overview", url: "/" },
      { title: "Analytics", url: "/analytics" },
    ]
  },
  { title: "My Modules", url: "/my-modules", icon: Boxes },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Wizard", url: "/wizard", icon: Wand2 },
  { title: "Upgrades", url: "/upgrades", icon: ArrowUpCircle },
  { title: "Team", url: "/team", icon: Users },
];

const managementItems = [
  { title: "Access Management", url: "/settings", icon: Shield },
  { title: "Network Settings", url: "/settings", icon: Network },
  { title: "Data Storage", url: "/settings", icon: FolderOpen },
];

const bottomNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>("Dashboard");

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col h-screen bg-card",
        "fixed left-0 top-0 z-40",
        "border-r border-border"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                <span className="font-semibold text-sm text-foreground tracking-tight">
                  The Last Software
                </span>
                <span className="text-xs text-muted-foreground">
                  SaaS Composition
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!collapsed && (
          <button className="ml-auto text-muted-foreground hover:text-foreground">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Menu Label */}
      {!collapsed && (
        <div className="px-5 pt-6 pb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Main Menu
          </span>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-none">
        {mainNavItems.map((item) => (
          <div key={item.title}>
            {item.hasSubmenu ? (
              <>
                <button
                  onClick={() => setExpandedMenu(expandedMenu === item.title ? null : item.title)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
                    "text-foreground bg-accent",
                    "transition-colors duration-100",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.title}</span>
                      <ChevronRight 
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expandedMenu === item.title && "rotate-90"
                        )} 
                      />
                    </>
                  )}
                </button>
                <AnimatePresence>
                  {!collapsed && expandedMenu === item.title && item.submenu && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-9 py-1 space-y-0.5">
                        {item.submenu.map((subitem) => (
                          <NavLink
                            key={subitem.title}
                            to={subitem.url}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            activeClassName="text-foreground font-medium"
                          >
                            {subitem.title}
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  "text-muted-foreground",
                  "hover:text-foreground hover:bg-accent",
                  "transition-colors duration-100",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="text-foreground bg-accent"
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-sm font-medium"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            )}
          </div>
        ))}

        {/* Management Section */}
        {!collapsed && (
          <div className="pt-6 pb-2 px-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Management
            </span>
          </div>
        )}
        
        {managementItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-muted-foreground",
              "hover:text-foreground hover:bg-accent",
              "transition-colors duration-100",
              collapsed && "justify-center px-2"
            )}
            activeClassName="text-foreground bg-accent"
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-sm font-medium"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 space-y-1 border-t border-border">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-muted-foreground",
              "hover:text-foreground hover:bg-accent",
              "transition-colors duration-100",
              collapsed && "justify-center px-2"
            )}
            activeClassName="text-foreground bg-accent"
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-sm font-medium"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full",
            "text-muted-foreground",
            "hover:text-foreground hover:bg-accent",
            "transition-colors duration-100",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px]" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
