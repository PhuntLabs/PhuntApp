
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, User, Sparkles, Gamepad, Shield, Paintbrush, Code, Bug, Bell, Link2, Search, Hand, ShieldQuestion, Users, KeyRound, MonitorSmartphone, Film, QrCode, Store, Trophy } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

type SectionId = 'account' | 'profiles' | 'connections' | 'game-activity' | 'security' | 'theme' | 'developer' | 'bugs' | 'notifications' | 'privacy' | 'family' | 'authorized-apps' | 'devices' | 'clips' | 'qr' | 'shop' | 'quests';

const accountSettings = [
  { id: 'account', label: 'My Account', icon: User, component: AccountSettings },
  { id: 'profiles', label: 'Profiles', icon: Sparkles, component: ProfileSettings },
  { id: 'privacy', label: 'Privacy & Safety', icon: Shield, component: SecuritySettings }, // Remapped
  { id: 'family', label: 'Family Center', icon: Users, component: GameActivitySettings }, // Placeholder
  { id: 'authorized-apps', label: 'Authorized Apps', icon: KeyRound, component: NotificationsSettings }, // Placeholder
  { id: 'devices', label: 'Devices', icon: MonitorSmartphone, component: SecuritySettings }, // Placeholder
  { id: 'connections', label: 'Connections', icon: Link2, component: ConnectionsSettings },
  { id: 'clips', label: 'Clips', icon: Film, component: DeveloperSettings }, // Placeholder
  { id: 'qr', label: 'Scan QR Code', icon: QrCode, component: BugReportSettings }, // Placeholder
];

const appSettings = [
    { id: 'theme', label: 'Appearance', icon: Paintbrush, component: ThemeSettings },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSettings },
];

const activitySettings = [
     { id: 'game-activity', label: 'Activity Status', icon: Gamepad, component: GameActivitySettings },
];

const billingSettings = [
    { id: 'shop', label: 'Shop', icon: Store, component: AccountSettings }, // Placeholder
    { id: 'quests', label: 'Quests', icon: Trophy, component: AccountSettings }, // Placeholder
];

const debugSettings = [
     { id: 'developer', label: 'Developer', icon: Code, component: DeveloperSettings },
     { id: 'bugs', label: 'Bugs & Feedback', icon: Bug, component: BugReportSettings },
]

const allSettings = [...accountSettings, ...appSettings, ...activitySettings, ...billingSettings, ...debugSettings];


export function MobileSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
  };
  
  const handleCloseSection = () => {
      setActiveSection(null);
  }

  const ActiveComponent = allSettings.find(s => s.id === activeSection)?.component;

  return (
    <div className="h-full relative overflow-hidden bg-background">
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
                    <div className="flex flex-col h-full bg-card">
                         <div className="p-4 border-b flex items-center">
                            <Button variant="ghost" size="icon" onClick={handleCloseSection} className="mr-2">
                                <ChevronLeft />
                            </Button>
                            <h1 className="text-xl font-bold">{allSettings.find(s=>s.id===activeSection)?.label}</h1>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <ActiveComponent />
                        </ScrollArea>
                    </div>
                ) : (
                     <div className="flex flex-col h-full">
                        <div className="p-4 border-b flex items-center gap-2">
                             <Button variant="ghost" size="icon">
                                <ChevronLeft />
                             </Button>
                            <h1 className="text-xl font-bold">Settings</h1>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground"/>
                                <Input 
                                    placeholder="Search" 
                                    className="pl-10 h-11 bg-muted border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1 px-4">
                            <nav className="flex flex-col gap-4">
                                <div className="space-y-1">
                                    <h2 className="text-sm font-semibold text-muted-foreground px-3">Account Settings</h2>
                                     <div className="bg-card rounded-xl p-2 space-y-1">
                                        {accountSettings.map(section => (
                                            <button 
                                                key={section.id} 
                                                onClick={() => handleSelectSection(section.id as SectionId)}
                                                className="flex items-center justify-between w-full p-3 rounded-lg text-left hover:bg-secondary/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <section.icon className="size-5 text-muted-foreground"/>
                                                    <span className="font-medium">{section.label}</span>
                                                </div>
                                                <ChevronRight className="size-5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                 <div className="space-y-1">
                                    <h2 className="text-sm font-semibold text-muted-foreground px-3">App Settings</h2>
                                     <div className="bg-card rounded-xl p-2 space-y-1">
                                        {appSettings.map(section => (
                                            <button 
                                                key={section.id} 
                                                onClick={() => handleSelectSection(section.id as SectionId)}
                                                className="flex items-center justify-between w-full p-3 rounded-lg text-left hover:bg-secondary/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <section.icon className="size-5 text-muted-foreground"/>
                                                    <span className="font-medium">{section.label}</span>
                                                </div>
                                                <ChevronRight className="size-5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                 <div className="space-y-1">
                                    <h2 className="text-sm font-semibold text-muted-foreground px-3">Activity Settings</h2>
                                     <div className="bg-card rounded-xl p-2 space-y-1">
                                        {activitySettings.map(section => (
                                            <button 
                                                key={section.id} 
                                                onClick={() => handleSelectSection(section.id as SectionId)}
                                                className="flex items-center justify-between w-full p-3 rounded-lg text-left hover:bg-secondary/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <section.icon className="size-5 text-muted-foreground"/>
                                                    <span className="font-medium">{section.label}</span>
                                                </div>
                                                <ChevronRight className="size-5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-sm font-semibold text-muted-foreground px-3">Billing Settings</h2>
                                     <div className="bg-card rounded-xl p-2 space-y-1">
                                        {billingSettings.map(section => (
                                            <button 
                                                key={section.id} 
                                                onClick={() => handleSelectSection(section.id as SectionId)}
                                                className="flex items-center justify-between w-full p-3 rounded-lg text-left hover:bg-secondary/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <section.icon className="size-5 text-muted-foreground"/>
                                                    <span className="font-medium">{section.label}</span>
                                                </div>
                                                <ChevronRight className="size-5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-sm font-semibold text-muted-foreground px-3">Debug</h2>
                                     <div className="bg-card rounded-xl p-2 space-y-1">
                                        {debugSettings.map(section => (
                                            <button 
                                                key={section.id} 
                                                onClick={() => handleSelectSection(section.id as SectionId)}
                                                className="flex items-center justify-between w-full p-3 rounded-lg text-left hover:bg-secondary/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <section.icon className="size-5 text-muted-foreground"/>
                                                    <span className="font-medium">{section.label}</span>
                                                </div>
                                                <ChevronRight className="size-5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </nav>
                        </ScrollArea>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
