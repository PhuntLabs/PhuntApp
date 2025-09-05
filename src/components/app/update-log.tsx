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
import { Rocket, Sparkles, Paintbrush, User, Server, Link as LinkIcon, Bug, ShieldCheck, KeyRound } from 'lucide-react';

const APP_VERSION = '1.0.1';
const LOCAL_STORAGE_KEY = `changelog_seen_${APP_VERSION}`;

const updates = [
    {
        title: 'Roles & Customization',
        icon: Sparkles,
        description: 'Server owners can now create custom roles with unique colors. Members\' names will appear colored, and roles are displayed on user profiles within the server.',
    },
    {
        title: 'Custom Invite Links',
        icon: LinkIcon,
        description: 'Tired of random server IDs? Owners can now set a custom, memorable invite link for their server, like "/join/community".',
    },
    {
        title: '2-Factor Authentication (WIP)',
        icon: ShieldCheck,
        description: 'The journey to enhanced security begins! You can now access the Security tab in settings to see the upcoming 2FA setup flow using an authenticator app. Full functionality coming soon.',
    },
    {
        title: 'Bug Squashing & Stability',
        icon: Bug,
        description: 'Fixed major bugs preventing servers, friend requests, and discovery from loading correctly. Also fixed an issue where newly created servers would disappear on refresh.',
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
          <Button onClick={handleClose}>Let's Go!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    