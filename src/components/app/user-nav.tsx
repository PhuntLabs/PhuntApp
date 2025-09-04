'use client';

import { User } from 'firebase/auth';
import { LogOut, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserNavProps {
    user: User | null;
    logout: () => void;
}

export function UserNav({ user, logout }: UserNavProps) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
            <Avatar className="size-8">
              <AvatarImage src={user.photoURL || "https://picsum.photos/100"} />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
