'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';
import { Gamepad2, School, BookUser, Heart, Palette, Users, PlusSquare, ChevronRight } from 'lucide-react';

interface AddServerDialogProps {
  children: React.ReactNode;
  onCreateServer: (name: string) => Promise<void>;
}

const templates = [
  { name: 'Gaming', icon: Gamepad2 },
  { name: 'School Club', icon: School },
  { name: 'Study Group', icon: BookUser },
  { name: 'Friends', icon: Heart },
  { name: 'Artists & Creators', icon: Palette },
  { name: 'Local Community', icon: Users },
];


export function AddServerDialog({ children, onCreateServer }: AddServerDialogProps) {
  const [serverName, setServerName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'select' | 'create' | 'join'>('select');

  const router = useRouter();

  const handleCreate = async (name: string) => {
    setIsLoading(true);
    try {
      await onCreateServer(name);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create server", error);
    } finally {
      setIsLoading(false);
      setView('select');
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteLink.trim()) {
      const link = inviteLink.trim().startsWith('/join/')
        ? inviteLink.trim()
        : `/join/${inviteLink.trim()}`;
      router.push(link);
      setIsOpen(false);
      setView('select');
    }
  };
  
  const handleTemplateClick = (templateName: string) => {
    setServerName(`${templateName} Server`);
    setView('create');
  }

  const renderContent = () => {
    switch(view) {
        case 'create':
            return (
                <div className="text-center p-4">
                     <DialogHeader>
                        <DialogTitle className="text-2xl">Customize your server</DialogTitle>
                        <DialogDescription>
                            Give your new server a personality with a name. You can always change it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-8">
                         <Label htmlFor="server-name" className="text-left text-xs font-bold uppercase text-muted-foreground">Server Name</Label>
                         <Input
                            id="server-name"
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            required
                        />
                    </div>
                     <DialogFooter className="flex-col gap-2">
                        <Button onClick={() => handleCreate(serverName)} disabled={isLoading || !serverName.trim()} className="w-full">
                         {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                         <Button variant="ghost" onClick={() => setView('select')}>Back</Button>
                    </DialogFooter>
                </div>
            )
        case 'join':
            return (
                 <div className="text-center p-4">
                     <DialogHeader>
                        <DialogTitle className="text-2xl">Join a Server</DialogTitle>
                        <DialogDescription>
                            Enter an invite link to join an existing server.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleJoinSubmit} className="my-8">
                        <Label htmlFor="invite-link" className="text-left text-xs font-bold uppercase text-muted-foreground">Invite Link</Label>
                        <Input
                            id="invite-link"
                            value={inviteLink}
                            onChange={(e) => setInviteLink(e.target.value)}
                            placeholder="e.g., goat"
                            required
                        />
                         <Button type="submit" variant="secondary" disabled={!inviteLink.trim()} className="w-full mt-4">
                            Join Server
                        </Button>
                    </form>
                    <DialogFooter>
                         <Button variant="ghost" onClick={() => setView('select')}>Back</Button>
                    </DialogFooter>
                </div>
            )
        case 'select':
        default:
            return (
                 <div className="p-4 text-center">
                    <DialogHeader>
                    <DialogTitle className="text-2xl">Create Your Server</DialogTitle>
                    <DialogDescription>
                        Your server is where you and your friends hang out. Make yours and start talking.
                    </DialogDescription>
                    </DialogHeader>
                    
                    <div className="my-4">
                        <Button variant="outline" className="w-full h-auto justify-start p-4" onClick={() => handleTemplateClick('My')}>
                            <div className="bg-primary/20 p-2 rounded-md">
                                <PlusSquare className="size-5 text-primary" />
                            </div>
                            <span className="font-semibold ml-4">Create My Own</span>
                             <ChevronRight className="ml-auto size-5 text-muted-foreground"/>
                        </Button>
                    </div>

                    <div>
                        <h3 className="uppercase text-xs font-bold text-muted-foreground mb-2 text-left">Start from a template</h3>
                        <div className="space-y-2">
                        {templates.map(({ name, icon: Icon }) => (
                            <Button key={name} variant="outline" className="w-full h-auto justify-start p-4" onClick={() => handleTemplateClick(name)}>
                                <div className="bg-primary/20 p-2 rounded-md">
                                    <Icon className="size-5 text-primary"/>
                                </div>
                                <span className="font-semibold ml-4">{name}</span>
                                <ChevronRight className="ml-auto size-5 text-muted-foreground"/>
                            </Button>
                        ))}
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-8 bg-card rounded-lg p-4">
                        <div className="text-center w-full">
                            <h3 className="font-semibold">Have an invite already?</h3>
                            <Button className="w-full mt-2" onClick={() => setView('join')}>
                                Join a Server
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setTimeout(() => setView('select'), 300); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
