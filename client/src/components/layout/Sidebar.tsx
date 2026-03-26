import { NavLink } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  PenToolIcon,
  CalendarIcon,
  GitMergeIcon,
  UsersIcon,
  BarChart3Icon,
  ImageIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboardIcon,
      path: '/'
    },
    {
      id: 'content',
      label: 'Content Studio',
      icon: PenToolIcon,
      path: '/content'
    },
    {
      id: 'scheduler',
      label: 'Post Scheduler',
      icon: CalendarIcon,
      path: '/scheduler'
    },
    {
      id: 'pipelines',
      label: 'Automation',
      icon: GitMergeIcon,
      path: '/pipelines'
    },
    {
      id: 'pages',
      label: 'Pages Manager',
      icon: UsersIcon,
      path: '/pages'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3Icon,
      path: '/analytics'
    },
    {
      id: 'agency',
      label: 'Agency Hub',
      icon: SparklesIcon,
      path: '/agency'
    },
    {
      id: 'media',
      label: 'Media Library',
      icon: ImageIcon,
      path: '/media'
    }];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out lg:relative lg:flex lg:translate-x-0",
        isMobileOpen ? "translate-x-0 w-[280px] shadow-2xl" : "-translate-x-full",
        !isMobileOpen && (isCollapsed ? 'lg:w-20' : 'lg:w-64')
      )}>

      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
            <SparklesIcon className="h-5 w-5" />
          </div>
          {(!isCollapsed || isMobileOpen) &&
            <span className="whitespace-nowrap font-bold tracking-tight text-foreground transition-opacity duration-300">
              CreatorGene
            </span>
          }
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => isMobileOpen && setIsMobileOpen?.(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={isCollapsed ? item.label : undefined}>

                <Icon className="h-5 w-5 shrink-0" />

                {(!isCollapsed || isMobileOpen) &&
                  <span className="whitespace-nowrap">{item.label}</span>
                }
              </NavLink>);
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          onClick={() => isMobileOpen && setIsMobileOpen?.(false)}
          className={({ isActive }) => cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
            isActive && "bg-muted text-foreground"
          )}
          title={isCollapsed ? 'Settings' : undefined}>

          <SettingsIcon className="h-5 w-5 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span>Settings</span>}
        </NavLink>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground focus:outline-none">

        {isCollapsed ?
          <ChevronRightIcon className="h-4 w-4" /> :
          <ChevronLeftIcon className="h-4 w-4" />
        }
      </button>
    </aside>);
}