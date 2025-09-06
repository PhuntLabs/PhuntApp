
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountSettings } from './settings/account-settings';
import { SecuritySettings } from './settings/security-settings';
import { ThemeSettings } from './settings/theme-settings';
import { BugReportSettings } from './settings/bug-report-settings';
import { ProfileSettings } from './settings/profile-settings';
import { GameActivitySettings } from './settings/game-activity-settings';
import { DeveloperSettings } from './settings/developer-settings';

type Section = 'account' | 'profiles' | 'security' | 'theme' | 'bugs' | 'game-activity' | 'developer';

const sections = [
  { id: 'account', label: 'My Account', icon: User },
  { id: 'profiles', label: 'Profiles', icon: Sparkles },
  { id: 'game-activity', label: 'Game Activity', icon: Gamepad },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'theme', label: 'Theme', icon: Paintbrush },
  { id: 'developer', label: 'Developer', icon: Code },
  { id: 'bugs', label: 'Bugs & Feedback', icon: Bug },
] as const;

export function SettingsDialog({ children, defaultSection = 'account', onOpenChange }: { children: React.ReactNode, defaultSection?: Section, onOpenChange?: (open: boolean) => void }) {
  const [activeSection, setActiveSection] = useState<Section>(defaultSection);

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
      case 'game-activity':
        return <GameActivitySettings />;
      case 'security':
        return <SecuritySettings />;
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
        <aside className="w-56 hidden sm:flex flex-col bg-secondary/30 p-4">
          <nav className="flex flex-col gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  'justify-start',
                  activeSection === section.id && 'bg-accent text-accent-foreground'
                )}
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="mr-2 h-4 w-4" />
                {section.label}
              </Button>
            ))}
          </nav>
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
