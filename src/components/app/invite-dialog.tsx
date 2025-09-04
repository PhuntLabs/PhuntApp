
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
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteDialogProps {
  children: React.ReactNode;
  serverId: string;
}

export function InviteDialog({ children, serverId }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const inviteLink = `${window.location.origin}/join/${serverId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
        setCopied(true);
        toast({ title: 'Copied!', description: 'Invite link copied to clipboard.' });
        setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Share this link with others to grant them access to this server.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
            <Label htmlFor="invite-link">Server Invite Link</Label>
            <div className="flex items-center space-x-2">
                <Input id="invite-link" value={inviteLink} readOnly />
                <Button type="button" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
