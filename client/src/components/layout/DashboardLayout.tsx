import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/': 'Overview',
      '/content': 'Content Studio',
      '/scheduler': 'Post Scheduler',
      '/pipelines': 'Automation Pipelines',
      '/pages': 'Pages Manager',
      '/analytics': 'Analytics',
      '/media': 'Media Library',
      '/settings': 'Settings'
    };
    return titles[pathname] || 'Dashboard';
  };
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar pageTitle={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>);

}