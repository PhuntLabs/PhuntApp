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
import { Separator } from '@/components/ui/separator';
import { Bot } from 'lucide-react';
import { BOT_USERNAME } from '@/ai/bots/config';

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
            <DialogTitle>Add Friends</DialogTitle>
            <DialogDescription>
              Add friends by their username, or add a bot to chat with.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
                <Bot className="size-5" />
                <span className="font-medium">{BOT_USERNAME}</span>
            </div>
            <Button size="sm" onClick={handleAddBot}>Add</Button>
          </div>
          
          <div className="relative py-2">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">OR</span>
          </div>

          <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
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
              <DialogFooter className="mt-4">
                <Button type="submit">Send Friend Request</Button>
              </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
