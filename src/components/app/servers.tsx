'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Servers() {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Servers</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Gaming HQ">
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src="https://picsum.photos/seed/gaming/100" />
                    <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                  Gaming HQ
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Design Nerds">
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src="https://picsum.photos/seed/design/100" />
                    <AvatarFallback>D</AvatarFallback>
                  </Avatar>
                  Design Nerds
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
    )
}