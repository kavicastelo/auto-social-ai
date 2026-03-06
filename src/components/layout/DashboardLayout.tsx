import React, { useState } from 'react';
import { Sidebar, PageType } from './Sidebar';
import { Topbar } from './Topbar';
interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}
export function DashboardLayout({
  children,
  currentPage,
  setCurrentPage
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const getPageTitle = (page: PageType) => {
    const titles: Record<PageType, string> = {
      dashboard: 'Overview',
      content: 'Content Studio',
      scheduler: 'Post Scheduler',
      pipelines: 'Automation Pipelines',
      pages: 'Pages Manager',
      analytics: 'Analytics',
      media: 'Media Library',
      settings: 'Settings'
    };
    return titles[page] || 'Dashboard';
  };
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar pageTitle={getPageTitle(currentPage)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>);

}