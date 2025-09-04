'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';

export function Servers() {
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Servers
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarMenu>
              {/* Server list will be populated from Firestore */}
            </SidebarMenu>
          </SidebarGroup>
    )
}
