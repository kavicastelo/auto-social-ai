import { useState } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PageType } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ContentStudioPage } from './pages/ContentStudioPage';
import { PostSchedulerPage } from './pages/PostSchedulerPage';
import { AutomationPipelinesPage } from './pages/AutomationPipelinesPage';
import { PagesManagerPage } from './pages/PagesManagerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
export function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'content':
        return <ContentStudioPage />;
      case 'scheduler':
        return <PostSchedulerPage />;
      case 'pipelines':
        return <AutomationPipelinesPage />;
      case 'pages':
        return <PagesManagerPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'media':
        return <MediaLibraryPage />;
      case 'settings':
        return (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground mt-2">
                Settings configuration coming soon.
              </p>
            </div>
          </div>);

      default:
        return <DashboardPage />;
    }
  };
  return (
    <DashboardLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>);

}