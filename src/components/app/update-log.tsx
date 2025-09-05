
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
import { Rocket, Sparkles, Gamepad2, Bot, MessageCirclePlus } from 'lucide-react';

const APP_VERSION = '1.0.5';
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Introducing: The Game Hub!',
        icon: Gamepad2,
        description: 'Launch and play popular browser games directly within the app. Your status will automatically update to show what you\'re playing, and friends can even join from your profile!',
    },
    {
        title: 'Slash Commands Are Here',
        icon: Sparkles,
        description: 'Moderate your server with ease using new slash commands. Use /clean, /lock, /kick, and /ban to manage your channels and members.',
    },
    {
        title: 'Say Hello to Bots',
        icon: Bot,
        description: 'Add our first phunt bot, @qolforu, from the Discovery page! Use its commands like /poll and /embed to add fun and utility to your server.',
    },
    {
        title: 'Custom Welcome Messages',
        icon: MessageCirclePlus,
        description: 'Set a specific channel in your server settings to have the app automatically post a warm welcome message whenever a new member joins.',
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
                    This is a big one! Here are the latest features.
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
          <Button onClick={handleClose}>Explore New Features</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
