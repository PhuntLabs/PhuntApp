
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
import { Rocket, Sparkles, Bug, ShieldCheck, Image as ImageIcon } from 'lucide-react';

const APP_VERSION = '1.0.3';
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Welcome to phunt!',
        icon: Sparkles,
        description: 'The app has been officially renamed to phunt! We hope you like the new name as much as we do.',
    },
    {
        title: 'Image Sharing is Here!',
        icon: ImageIcon,
        description: 'You can now paste images directly into the chat input to send them to your friends and in server channels. Give it a try!',
    },
    {
        title: 'Major Bug Squashing',
        icon: Bug,
        description: 'Fixed critical permission errors that prevented users from joining servers, accepting friend requests, or seeing their DMs and servers correctly.',
    },
    {
        title: 'Stability Improvements',
        icon: ShieldCheck,
        description: 'Resolved a startup crash and data loading race condition that made the app feel buggy. The initial load should be much smoother now.',
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
