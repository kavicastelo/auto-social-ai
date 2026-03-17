import { useState } from 'react';
import { SearchIcon, BellIcon, UserIcon, LogOutIcon, ChevronDownIcon, Building2Icon, PlusIcon, SettingsIcon, MenuIcon } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface TopbarProps {
  pageTitle: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export function Topbar({ pageTitle, isMobileOpen, setIsMobileOpen }: TopbarProps) {
  const { user, workspaces, activeWorkspace, setActiveWorkspace, logout } = useAuth();
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-3 md:px-6 sticky top-0 z-30 backdrop-blur-md bg-background/80">
      <div className="flex items-center gap-1.5 md:gap-4 flex-1 min-w-0">
        {setIsMobileOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-base md:text-lg lg:text-xl font-bold text-foreground tracking-tight truncate hidden xs:block">{pageTitle}</h1>

        <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

        {/* Workspace Switcher - Polished */}
        <div className="relative">
          <button
            onClick={() => setIsWsOpen(!isWsOpen)}
            className="flex items-center gap-1.5 md:gap-2 rounded-full border bg-muted/20 hover:bg-muted/40 px-2 py-1 md:px-3 md:py-1.5 transition-all duration-200 group max-w-[140px] md:max-w-none"
          >
            <div className="h-4 w-4 md:h-5 md:w-5 shrink-0 rounded bg-violet-500 text-white flex items-center justify-center text-[8px] md:text-[10px] font-bold shadow-sm">
              {activeWorkspace?.name?.charAt(0) || 'W'}
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-foreground truncate">{activeWorkspace?.name}</span>
            <ChevronDownIcon className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200 shrink-0", isWsOpen && "rotate-180")} />
          </button>

          {isWsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsWsOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-56 md:w-64 rounded-xl border bg-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-widest">Switch Workspace</p>
                <div className="space-y-1">
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setIsWsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        activeWorkspace?.id === ws.id
                          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Building2Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{ws.name}</span>
                      {activeWorkspace?.id === ws.id && <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <Link to="/settings" onClick={() => setIsWsOpen(false)}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-500/5 transition-all text-left"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Manage Workspaces
                    </button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0 ml-2">
        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-40 lg:w-72 bg-muted/30 pl-10 border-transparent focus-visible:bg-background transition-all h-9" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground h-9 w-9">
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-background"></span>
        </Button>

        {/* User Profile & Logout */}
        <div className="relative">
          <button
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-2 md:gap-3 group focus:outline-none"
          >
            <div className="flex flex-col items-end hidden lg:flex">
              <span className="text-sm font-semibold leading-tight">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">Pro Account</span>
            </div>
            <div className="h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-full border border-border bg-muted ring-offset-background group-hover:ring-2 group-hover:ring-primary/20 transition-all shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900 dark:to-indigo-900">
                  <UserIcon className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                </div>
              )}
            </div>
          </button>

          {isUserOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-52 md:w-56 rounded-xl border bg-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 mb-1 border-b pb-3 lg:hidden">
                  <p className="text-xs font-bold truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link to="/settings" onClick={() => setIsUserOpen(false)}>
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-left"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    My Settings
                  </button>
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
                >
                  <LogOutIcon className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}