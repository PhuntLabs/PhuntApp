
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Shield,
  User,
  Paintbrush,
  Bug,
  X,
  Sparkles,
  Gamepad,
  Code,
  Bell,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountSettings } from './settings/account-settings';
import { SecuritySettings } from './settings/security-settings';
import { ThemeSettings } from './settings/theme-settings';
import { BugReportSettings } from './settings/bug-report-settings';
import { ProfileSettings } from './settings/profile-settings';
import { GameActivitySettings } from './settings/game-activity-settings';
import { DeveloperSettings } from './settings/developer-settings';
import { NotificationsSettings } from './settings/notifications-settings';
import { ConnectionsSettings } from './settings/connections-settings';
import { useAuth } from '@/hooks/use-auth';

type Section = 'account' | 'profiles' | 'connections' | 'security' | 'theme' | 'bugs' | 'game-activity' | 'developer' | 'notifications';

const userSettingsSections = [
  { id: 'account', label: 'My Account', icon: User },
  { id: 'profiles', label: 'Profiles', icon: Sparkles },
  { id: 'security', label: 'Privacy & Safety', icon: Shield },
  { id: 'connections', label: 'Connections', icon: Link2 },
] as const;

const appSettingsSections = [
  { id: 'theme', label: 'Appearance', icon: Paintbrush },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'game-activity', label: 'Game Activity', icon: Gamepad },
] as const;

const debugSettingsSections = [
  { id: 'developer', label: 'Developer', icon: Code },
  { id: 'bugs', label: 'Bugs & Feedback', icon: Bug },
]

export function SettingsDialog({ children, defaultSection = 'account', onOpenChange }: { children: React.ReactNode, defaultSection?: Section, onOpenChange?: (open: boolean) => void }) {
  const [activeSection, setActiveSection] = useState<Section>(defaultSection);
  const { logout } = useAuth();

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    if (open) {
      setActiveSection(defaultSection);
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />;
      case 'profiles':
        return <ProfileSettings />;
      case 'connections':
        return <ConnectionsSettings />;
      case 'game-activity':
        return <GameActivitySettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'developer':
        return <DeveloperSettings />;
      case 'bugs':
        return <BugReportSettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-none w-full h-full sm:max-w-5xl sm:h-[90vh] sm:rounded-lg flex p-0">
        <aside className="w-64 hidden sm:flex flex-col bg-secondary/30 p-4">
          <nav className="flex flex-col gap-1">
            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">User Settings</h3>
            {userSettingsSections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  'justify-between',
                  activeSection === section.id && 'bg-accent text-accent-foreground'
                )}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
             <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">App Settings</h3>
             {appSettingsSections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  'justify-between',
                  activeSection === section.id && 'bg-accent text-accent-foreground'
                )}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Debug</h3>
             {debugSettingsSections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  'justify-between',
                  activeSection === section.id && 'bg-accent text-accent-foreground'
                )}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
          </nav>
           <div className="mt-auto">
              <Button variant="ghost" onClick={logout} className="justify-start w-full">
                Log Out
              </Button>
            </div>
        </aside>

        <main className="flex-1 p-6 relative overflow-y-auto">
          {renderSection()}
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full">
                <X className="size-5" />
                <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </main>
      </DialogContent>
    </Dialog>
  );
}
