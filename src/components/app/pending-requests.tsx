'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import type { FriendRequest } from '@/lib/types';

interface PendingRequestsProps {
  requests: FriendRequest[];
  onAccept: (requestId: string, fromUser: {id: string, displayName: string}) => void;
  onDecline: (requestId: string) => void;
}

export function PendingRequests({ requests, onAccept, onDecline }: PendingRequestsProps) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Pending - {requests.length}
      </SidebarGroupLabel>
      <SidebarMenu>
        {requests.map((req) => (
          <SidebarMenuItem key={req.id}>
            <div className='flex items-center justify-between w-full text-sm p-2'>
                <span>{req.from.displayName}</span>
                <div className='flex items-center gap-2'>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-500 hover:bg-green-500/10" onClick={() => onAccept(req.id, req.from)}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => onDecline(req.id)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
