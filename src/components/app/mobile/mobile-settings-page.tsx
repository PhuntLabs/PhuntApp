

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, User, Sparkles, Gamepad, Shield, Paintbrush, Code, Bug, Bell, Link2 } from 'lucide-react';
import { AccountSettings } from '../settings/account-settings';
import { ProfileSettings } from '../settings/profile-settings';
import { GameActivitySettings } from '../settings/game-activity-settings';
import { SecuritySettings } from '../settings/security-settings';
import { ThemeSettings } from '../settings/theme-settings';
import { DeveloperSettings } from '../settings/developer-settings';
import { BugReportSettings } from '../settings/bug-report-settings';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationsSettings } from '../settings/notifications-settings';
import { ConnectionsSettings } from '../settings/connections-settings';

type SectionId = 'account' | 'profiles' | 'connections' | 'game-activity' | 'security' | 'theme' | 'developer' | 'bugs' | 'notifications';

const sections = [
  { id: 'account', label: 'My Account', icon: User, component: AccountSettings },
  { id: 'profiles', label: 'Profiles', icon: Sparkles, component: ProfileSettings },
  { id: 'connections', label: 'Connections', icon: Link2, component: ConnectionsSettings },
  { id: 'game-activity', label: 'Game Activity', icon: Gamepad, component: GameActivitySettings },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSettings },
  { id: 'security', label: 'Security', icon: Shield, component: SecuritySettings },
  { id: 'theme', label: 'Theme', icon: Paintbrush, component: ThemeSettings },
  { id: 'developer', label: 'Developer', icon: Code, component: DeveloperSettings },
  { id: 'bugs', label: 'Bugs & Feedback', icon: Bug, component: BugReportSettings },
] as const;

export function MobileSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  const handleSelectSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
  };
  
  const handleCloseSection = () => {
      setActiveSection(null);
  }

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component;

  return (
    <div className="h-full relative overflow-hidden">
        <AnimatePresence>
            <motion.div 
                key={activeSection ? 'section' : 'list'}
                initial={{ x: activeSection ? '100%' : '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: activeSection ? '-100%' : '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0"
            >
                {activeSection && ActiveComponent ? (
                    <div className="flex flex-col h-full">
                         <div className="p-4 border-b flex items-center">
                            <Button variant="ghost" size="icon" onClick={handleCloseSection} className="mr-2">
                                <ChevronRight className="transform rotate-180" />
                            </Button>
                            <h1 className="text-xl font-bold">{sections.find(s=>s.id===activeSection)?.label}</h1>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <ActiveComponent />
                        </ScrollArea>
                    </div>
                ) : (
                     <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h1 className="text-2xl font-bold">Settings</h1>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            <nav className="flex flex-col gap-1">
                                {sections.map(section => (
                                    <button 
                                        key={section.id} 
                                        onClick={() => handleSelectSection(section.id)}
                                        className="flex items-center justify-between w-full p-3 rounded-lg text-left hover:bg-accent"
                                    >
                                        <div className="flex items-center gap-3">
                                            <section.icon className="size-5 text-muted-foreground"/>
                                            <span className="font-medium">{section.label}</span>
                                        </div>
                                        <ChevronRight className="size-5 text-muted-foreground" />
                                    </button>
                                ))}
                            </nav>
                        </ScrollArea>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
