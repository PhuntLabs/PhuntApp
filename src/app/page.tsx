import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  MessageSquare,
  Users,
  Bell,
  Settings,
  LogOut,
  Server,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src="https://picsum.photos/100" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">User</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Direct Messages" isActive>
                <MessageSquare />
                Direct Messages
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Public Rooms">
                <Users />
                Public Rooms
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Profile">
                <User />
                Profile
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout">
                <LogOut />
                Logout
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold">Direct Messages</h1>
        </div>
        <div className="flex-1 p-4">
          <p>Chat content will go here.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
