import { SearchIcon, BellIcon, UserIcon } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
interface TopbarProps {
  pageTitle: string;
}
export function Topbar({ pageTitle }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 md:block">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-muted/50 pl-9 border-transparent focus-visible:border-input" />

        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground">

          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-background"></span>
        </Button>

        <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-muted">
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900 dark:to-indigo-900">
            <UserIcon className="h-4 w-4 text-violet-700 dark:text-violet-300" />
          </div>
        </div>
      </div>
    </header>);

}