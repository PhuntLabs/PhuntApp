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

interface AddUserDialogProps {
  children: React.ReactNode;
  onAddUser: (username: string) => void;
}

export function AddUserDialog({ children, onAddUser }: AddUserDialogProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        
          <DialogHeader>
            <DialogTitle>Add a Friend</DialogTitle>
            <DialogDescription>
              Enter a username to send them a friend request.
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
      </DialogContent>
    </Dialog>
  );
}
