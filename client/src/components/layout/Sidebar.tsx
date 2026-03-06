import React from 'react';
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
  SparklesIcon } from
'lucide-react';
export type PageType =
'dashboard' |
'content' |
'scheduler' |
'pipelines' |
'pages' |
'analytics' |
'media' |
'settings';
interface SidebarProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}
export function Sidebar({
  currentPage,
  setCurrentPage,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    id: 'content',
    label: 'Content Studio',
    icon: PenToolIcon
  },
  {
    id: 'scheduler',
    label: 'Post Scheduler',
    icon: CalendarIcon
  },
  {
    id: 'pipelines',
    label: 'Automation',
    icon: GitMergeIcon
  },
  {
    id: 'pages',
    label: 'Pages Manager',
    icon: UsersIcon
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3Icon
  },
  {
    id: 'media',
    label: 'Media Library',
    icon: ImageIcon
  }];

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
            <SparklesIcon className="h-5 w-5" />
          </div>
          {!isCollapsed &&
          <span className="whitespace-nowrap font-bold tracking-tight text-foreground transition-opacity duration-300">
              AutoSocial AI
            </span>
          }
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as PageType)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                title={isCollapsed ? item.label : undefined}>

                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />

                {!isCollapsed &&
                <span className="whitespace-nowrap">{item.label}</span>
                }
              </button>);

          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCurrentPage('settings')}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground ${currentPage === 'settings' ? 'bg-muted text-foreground' : ''}`}
          title={isCollapsed ? 'Settings' : undefined}>

          <SettingsIcon className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground focus:outline-none">

        {isCollapsed ?
        <ChevronRightIcon className="h-4 w-4" /> :

        <ChevronLeftIcon className="h-4 w-4" />
        }
      </button>
    </aside>);

}