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

interface AddServerDialogProps {
  children: React.ReactNode;
  onCreateServer: (name: string) => Promise<void>;
}

export function AddServerDialog({ children, onCreateServer }: AddServerDialogProps) {
  const [serverName, setServerName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serverName.trim()) {
      setIsLoading(true);
      try {
        await onCreateServer(serverName.trim());
        setServerName('');
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to create server", error);
      } finally {
        setIsLoading(false);
      }
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
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create or Join a Server</DialogTitle>
          <DialogDescription>
            Create your own server or join one with an invite link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubmit}>
            <Label htmlFor="server-name" className="text-xs uppercase font-bold text-muted-foreground">Create a Server</Label>
            <div className="flex items-center gap-2 mt-2">
                <Input
                    id="server-name"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="My Awesome Server"
                    required
                />
                <Button type="submit" disabled={isLoading || !serverName.trim()}>
                 {isLoading ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </form>
        
        <div className="relative py-2">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
        </div>

        <form onSubmit={handleJoinSubmit}>
            <Label htmlFor="invite-link" className="text-xs uppercase font-bold text-muted-foreground">Join a Server</Label>
            <div className="flex items-center gap-2 mt-2">
                <Input
                    id="invite-link"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    placeholder="Enter invite link (e.g. goat)"
                    required
                />
                <Button type="submit" variant="secondary" disabled={!inviteLink.trim()}>
                    Join
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
    