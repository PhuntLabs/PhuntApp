
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rocket, Sparkles, Gem, Palette, User, MonitorSmartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_VERSION = '1.0.8'; // Incremented version
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Massive UI Revamp',
        icon: Palette,
        description: 'We\'ve completely redesigned the entire application to be more modern, responsive, and easier on the eyes. Enjoy a cleaner, more polished experience on all devices.',
    },
    {
        title: 'Introducing: Turbo',
        icon: Gem,
        description: 'Phunt is free, forever. If you enjoy the app, you can now support its development through the new Turbo page, accessible from the main menu.',
    },
    {
        title: 'Your Profile, Your Way',
        icon: User,
        description: 'You can now set a custom Display Name that can be different from your unique @username. Head to Account Settings to change it!',
    },
    {
        title: 'A Better Mobile Experience',
        icon: MonitorSmartphone,
        description: 'On mobile devices, you\'ll now be prompted to add Phunt to your home screen. This Progressive Web App (PWA) mode provides a faster, full-screen experience.',
    },
]

export function UpdateLog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenLog = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!hasSeenLog) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className={cn("flex items-center gap-3 p-4 -m-6 mb-0 rounded-t-lg animated-gradient text-white")}>
             <div className="bg-white/20 p-2.5 rounded-lg">
                <Rocket className="size-6" />
             </div>
             <div>
                <DialogTitle className="text-2xl text-white">What's New in phunt {APP_VERSION}?</DialogTitle>
                <DialogDescription className="text-white/80">
                    Here are the latest features and improvements.
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-6 py-4">
                {updates.map(({ title, icon: Icon, description }) => (
                     <div key={title} className="flex items-start gap-4">
                        <div className="bg-secondary/50 text-secondary-foreground p-2 rounded-md mt-1">
                            <Icon className="size-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <DialogFooter className="!mt-2">
          <Button onClick={handleClose}>Explore New Features</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
