
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Check, Bot, Shield, Loader2 } from 'lucide-react';
import type { UserProfile, Server } from '@/lib/types';
import { useServer } from '@/hooks/use-server';
import { useToast } from '@/hooks/use-toast';
import { allPermissionDetails } from '@/lib/permissions';

const qolforuPermissions = [
    'viewChannels', 'sendMessages', 'mentionEveryone'
];

interface AddBotToServerDialogProps {
  children: React.ReactNode;
  bot: UserProfile;
  availableServers: Server[];
}

export function AddBotToServerDialog({ children, bot, availableServers }: AddBotToServerDialogProps) {
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addBotToServer } = useServer(undefined);
  const { toast } = useToast();

  const handleAddBot = async () => {
    if (!selectedServerId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a server.' });
        return;
    }
    
    setIsAdding(true);
    try {
        await addBotToServer(bot.uid, selectedServerId);
        toast({ title: 'Success!', description: `${bot.displayName} has been added to your server.` });
        setIsOpen(false);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsAdding(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
            <Avatar className="size-20">
                <AvatarImage src={bot.photoURL || undefined} />
                <AvatarFallback>{bot.displayName[0]}</AvatarFallback>
            </Avatar>
          <DialogTitle>Add {bot.displayName} to a server</DialogTitle>
          <DialogDescription>
            This bot will be added as a new member to the server you choose.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Add to Server</Label>
                <Select value={selectedServerId} onValueChange={setSelectedServerId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a server..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableServers.map(server => (
                            <SelectItem key={server.id} value={server.id}>{server.name}</SelectItem>
                        ))}
                         {availableServers.length === 0 && <p className="p-2 text-sm text-muted-foreground">No available servers.</p>}
                    </SelectContent>
                </Select>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                 <h4 className="font-semibold flex items-center gap-2"><Shield className="size-4 text-primary"/>This bot will require the following permissions:</h4>
                 <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                    {qolforuPermissions.map(perm => (
                        <li key={perm} className="flex items-center gap-2">
                            <Check className="size-4 text-green-500"/>
                            {allPermissionDetails.find(p => p.id === perm)?.name || perm}
                        </li>
                    ))}
                 </ul>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBot} disabled={!selectedServerId || isAdding}>
            {isAdding && <Loader2 className="mr-2 size-4 animate-spin"/>}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
