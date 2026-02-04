import { Search, Bell, Plus, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeConfigurator } from "@/components/ThemeConfigurator";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-[15px] font-medium text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search - Command palette style */}
        <button className="hidden md:flex items-center gap-2 h-8 px-3 text-[13px] text-muted-foreground bg-secondary border border-border rounded-md hover:bg-accent transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="ml-4 flex items-center gap-0.5 text-[11px] text-muted-foreground/60 font-mono">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>

        {/* Add New */}
        <Button 
          size="sm" 
          className="h-8 px-3 text-[13px] font-medium gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </Button>

        {/* Theme Configurator */}
        <ThemeConfigurator />

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ml-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="User" />
                <AvatarFallback className="text-[11px]">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-[13px]">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px]">Billing</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px]">Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[13px]">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
