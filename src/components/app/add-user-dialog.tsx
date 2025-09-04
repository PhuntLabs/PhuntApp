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
import { BOT_USERNAME, BOT_PHOTO_URL } from '@/ai/bots/config';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface AddUserDialogProps {
  children: React.ReactNode;
  onAddUser: (username: string) => void;
  onAddBot: () => void;
}

export function AddUserDialog({ children, onAddUser, onAddBot }: AddUserDialogProps) {
  const [username, setUsername] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onAddUser(username.trim());
      setUsername('');
      setIsOpen(false);
    }
  };
  
  const handleAddBot = () => {
    onAddBot();
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        
          <DialogHeader>
            <DialogTitle>Add Friends & Bots</DialogTitle>
            <DialogDescription>
              Enter a username to send a friend request, or add one of the available bots.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. cool_user_123"
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Send Request</Button>
              </DialogFooter>
          </form>

          <Separator className="my-2" />

          <div>
             <h4 className="text-sm font-medium mb-2">Available Bots</h4>
             <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                        <AvatarImage src={BOT_PHOTO_URL} />
                        <AvatarFallback>{BOT_USERNAME[0]}</AvatarFallback>
                    </Avatar>
                    <span>{BOT_USERNAME}</span>
                </div>
                <Button size="sm" onClick={handleAddBot}>Add</Button>
             </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
