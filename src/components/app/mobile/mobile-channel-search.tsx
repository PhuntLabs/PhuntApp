
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Server, UserProfile, Role } from '@/lib/types';
import { ChevronLeft, ListFilter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from '../user-nav';

interface MobileChannelSearchProps {
  server: Server;
  members: UserProfile[];
  onClose: () => void;
}

const statusConfig = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
};

function MemberItem({ member }: { member: UserProfile }) {
    const status = member.status || 'offline';
    return (
        <UserNav user={member}>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent w-full text-left">
                <div className="relative">
                    <Avatar className="size-10">
                        <AvatarImage src={member.photoURL || undefined} />
                        <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background", statusConfig[status])} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{member.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.customStatus || status}</p>
                </div>
            </div>
        </UserNav>
    );
}

export function MobileChannelSearch({ server, members, onClose }: MobileChannelSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    return members.filter(m => m.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [members, searchQuery]);

  const membersByRole = useMemo(() => {
    const roles = [...(server.roles || [])].sort((a,b) => a.priority - b.priority);
    const groups: { role: Role; members: UserProfile[] }[] = [];
    const membersWithoutRoles: UserProfile[] = [];

    roles.forEach(role => {
        const roleMembers = filteredMembers.filter(member => server.memberDetails[member.uid]?.roles.includes(role.id));
        if (roleMembers.length > 0) {
            groups.push({ role, members: roleMembers });
        }
    });
    
    // Quick way to get members without assigned roles from the already filtered list
    const membersWithRoles = new Set(groups.flatMap(g => g.members.map(m => m.uid)));
    filteredMembers.forEach(member => {
        if(!membersWithRoles.has(member.uid)) {
            membersWithoutRoles.push(member);
        }
    });

    return { groups, membersWithoutRoles };
  }, [filteredMembers, server.roles, server.memberDetails]);


  return (
    <div className="flex flex-col h-full bg-background">
        <header className="p-4 border-b flex items-center gap-2">
            <Button variant="ghost" size="icon" className="mr-2" onClick={onClose}>
                <ChevronLeft />
            </Button>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground"/>
                <Input
                    placeholder="Search"
                    className="pl-10 h-10 bg-muted border-none rounded-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="ghost" size="icon">
                <ListFilter />
            </Button>
        </header>

        <Tabs defaultValue="members" className="flex-1 flex flex-col min-h-0">
            <div className="px-4">
                 <TabsList className="w-full">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="pins">Pins</TabsTrigger>
                    <TabsTrigger value="threads" className="hidden sm:inline-flex">Threads</TabsTrigger>
                    <TabsTrigger value="links" className="hidden sm:inline-flex">Links</TabsTrigger>
                    <TabsTrigger value="files" className="hidden sm:inline-flex">Files</TabsTrigger>
                </TabsList>
            </div>
             <ScrollArea className="flex-1">
                <TabsContent value="members" className="p-4 m-0">
                   <div className="space-y-4">
                        {membersByRole.groups.map(({ role, members }) => (
                            <div key={role.id}>
                                <h3 className="text-sm font-semibold uppercase px-2 mb-1" style={{ color: role.color || undefined }}>
                                    {role.name} &mdash; {members.length}
                                </h3>
                                <div className="space-y-1">
                                    {members.map(member => <MemberItem key={member.uid} member={member} />)}
                                </div>
                            </div>
                        ))}
                        {membersByRole.membersWithoutRoles.length > 0 && (
                             <div>
                                <h3 className="text-sm font-semibold uppercase px-2 mb-1 text-muted-foreground">
                                    Members &mdash; {membersByRole.membersWithoutRoles.length}
                                </h3>
                                <div className="space-y-1">
                                    {membersByRole.membersWithoutRoles.map(member => <MemberItem key={member.uid} member={member} />)}
                                </div>
                            </div>
                        )}
                   </div>
                </TabsContent>
                {/* Other tabs content can be added here */}
            </ScrollArea>
        </Tabs>
    </div>
  );
}
