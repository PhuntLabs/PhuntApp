
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
import { Rocket, Sparkles, Gamepad2, Bot, MessageCirclePlus, Paperclip, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_VERSION = '1.0.7'; // Incremented version
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Calling (Beta)',
        icon: Phone,
        description: 'Voice and video calling is now available for testing! You can enable it in Developer Settings. Please report any bugs you find!',
    },
    {
        title: 'Secure File Uploads',
        icon: Paperclip,
        description: 'You can now upload and share files of any type directly in your chats. All files are securely handled via Gofile.io, appearing as a clean, rich embed.',
    },
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
