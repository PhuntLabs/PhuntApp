'use client';

import { User } from 'firebase/auth';
import { LogOut, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';


interface UserNavProps {
    user: User | null;
    logout: () => void;
}

export function UserNav({ user, logout }: UserNavProps) {
  if (!user) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors">
            <Avatar className="size-8">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        <div className="relative h-24 bg-primary/10">
            {/* Placeholder for banner image */}
        </div>
        <div className="p-6">
            <Avatar className="size-20 absolute top-12 left-6 border-4 border-card">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-2xl">{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pt-10">
                <DialogTitle className="text-2xl">{user.displayName}</DialogTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Separator className="my-4" />
             <div className="flex flex-col gap-2">
                 <Button variant="ghost" className="justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </Button>
                <Button variant="ghost" onClick={() => logout()} className="justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
