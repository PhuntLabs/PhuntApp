
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
import { Badge } from '../ui/badge';
import { Rocket, Sparkles, MessageSquarePlus, Palette, User, Server, Link, Bug } from 'lucide-react';

const APP_VERSION = '1.0.0';
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Server Discovery & Joining',
        icon: Server,
        description: 'Explore and join public servers through the new Discovery page. Share invite links to bring friends into your communities.',
    },
    {
        title: 'Mentions & Statuses',
        icon: User,
        description: 'Mention users with "@username" to get their attention, highlighting the message. Set your status to Online, Idle, Do Not Disturb, or Offline.',
    },
    {
        title: 'Custom Server Emojis',
        icon: Sparkles,
        description: 'Server owners can now upload up to 10 custom emojis! Use them in chat with autocomplete, just like standard emojis.',
    },
    {
        title: 'Revamped Chat Input',
        icon: MessageSquarePlus,
        description: 'The chat input now features a custom emoji picker and autocompletes both user mentions and emoji shortcodes as you type.',
    },
    {
        title: 'Link Previews & Safety',
        icon: Link,
        description: 'Server invite links now show a rich embed with server details. Other external links will show a safety warning before you leave the app.',
    },
    {
        title: 'Theme Customization',
        icon: Palette,
        description: 'Choose from Light, Dark, and Amoled themes, or even set your own custom primary color in the new Settings panel.',
    },
    {
        title: 'Account Management',
        icon: User,
        description: 'Edit your profile, change your avatar and banner by uploading files, and reset your password all from within the new Account Settings.',
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
                <DialogTitle className="text-2xl">What's New in Version {APP_VERSION}?</DialogTitle>
                <DialogDescription>
                    Welcome to the first official release! Here are the highlights.
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

                 <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-muted-foreground mt-1">
                        <Bug className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Found a Bug?</h3>
                        <p className="text-sm text-muted-foreground">
                            For now, please send bug reports by adding and messaging <Badge variant="secondary">@heina</Badge> or <Badge variant="secondary">@thatguy123</Badge>. Thank you for helping us improve!
                        </p>
                    </div>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleClose}>Got it, thanks!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
