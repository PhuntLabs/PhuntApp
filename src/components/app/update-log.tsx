
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
import { Rocket, Sparkles, Bug, ShieldCheck, Wrench, Image as ImageIcon } from 'lucide-react';

const APP_VERSION = '1.0.4';
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Stability Overhaul',
        icon: Wrench,
        description: 'Version 1.0.4 is a major stability release focused on fixing critical bugs to make the app more reliable and enjoyable to use.',
    },
    {
        title: 'UI Layout Fixed',
        icon: Bug,
        description: 'Squashed a persistent bug that was breaking the main UI layout and causing elements to appear in the wrong place. The interface should now be stable.',
    },
    {
        title: 'Security Rules Hardened',
        icon: ShieldCheck,
        description: 'Completely rewrote the Firestore security rules from the ground up to be more robust and secure, fixing a wide range of permission-related errors.',
    },
     {
        title: 'Image Host Whitelisted',
        icon: ImageIcon,
        description: 'Fixed a runtime crash that occurred when users had profile banners hosted on previously un-whitelisted domains like i.pinimg.com.',
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
          <div className="flex items-center gap-3">
             <div className="bg-primary/20 text-primary p-2.5 rounded-lg">
                <Rocket className="size-6" />
             </div>
             <div>
                <DialogTitle className="text-2xl">What's New in phunt {APP_VERSION}?</DialogTitle>
                <DialogDescription>
                    We've been busy! Here are the latest updates and fixes.
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
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
        <DialogFooter>
          <Button onClick={handleClose}>Let's Go!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
