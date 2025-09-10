
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Server, UserProfile, UserStatus } from "@/lib/types";
import { Crown, Bot, Music, Gamepad2 } from "lucide-react";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MemberListProps {
    members: Partial<UserProfile>[];
    server: Server;
    loading: boolean;
}

const statusConfig: Record<UserStatus, { color: string }> = {
    online: { color: 'bg-green-500' },
    idle: { color: 'bg-yellow-500' },
    dnd: { color: 'bg-red-500' },
    offline: { color: 'bg-gray-500' },
};


export function MemberList({ members, server, loading }: MemberListProps) {
    if (loading) {
        return (
             <div className="w-60 flex-shrink-0 bg-secondary p-2 space-y-2">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground px-2">Members — ?</h2>
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
                 <div className="flex items-center gap-2 p-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>
        )
    }
    
    // Group members by their top role
    const roles = [...(server.roles || [])].sort((a,b) => a.priority - b.priority);
    const membersByRole: { [roleName: string]: Partial<UserProfile>[] } = {};
    const membersWithoutRoles: Partial<UserProfile>[] = [];
    const onlineMembers: Partial<UserProfile>[] = [];
    const offlineMembers: Partial<UserProfile>[] = [];

    members.forEach(member => {
      if (member.status !== 'offline') {
        onlineMembers.push(member);
      } else {
        offlineMembers.push(member);
      }
    });

    const roleGroups = roles
      .map(role => ({
        ...role,
        members: onlineMembers.filter(member => server.memberDetails?.[member.uid!]?.roles.includes(role.id))
      }))
      .filter(roleGroup => roleGroup.members.length > 0);

    const onlineMembersWithoutRole = onlineMembers.filter(member => {
        const memberRoles = server.memberDetails?.[member.uid!]?.roles || [];
        return !roles.some(r => memberRoles.includes(r.id));
    });

    return (
        <aside className="w-60 flex-shrink-0 bg-secondary p-2 overflow-y-auto">
             {roleGroups.map(roleGroup => (
                <div key={roleGroup.id} className="mb-4">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground px-2" style={{ color: roleGroup.color }}>
                        {roleGroup.name} — {roleGroup.members.length}
                    </h3>
                    <div className="space-y-1 mt-1">
                        {roleGroup.members.map(member => (
                            <MemberItem key={member.uid} member={member} server={server} topRoleColor={roleGroup.color} />
                        ))}
                    </div>
                </div>
             ))}

            {onlineMembersWithoutRole.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground px-2">
                        Online — {onlineMembersWithoutRole.length}
                    </h3>
                     <div className="space-y-1 mt-1">
                        {onlineMembersWithoutRole.map(member => (
                             <MemberItem key={member.uid} member={member} server={server} />
                        ))}
                    </div>
                </div>
            )}

            {offlineMembers.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground px-2">
                        Offline — {offlineMembers.length}
                    </h3>
                     <div className="space-y-1 mt-1 opacity-60">
                        {offlineMembers.map(member => (
                             <MemberItem key={member.uid} member={member} server={server} />
                        ))}
                    </div>
                </div>
            )}
        </aside>
    )
}

const MemberItem = ({ member, server, topRoleColor }: { member: Partial<UserProfile>, server: Server, topRoleColor?: string }) => {
    const isOwner = member.uid === server.ownerId;
    const status = member.status || 'offline';
    
    const serverProfile = server.memberDetails?.[member.uid!]?.profile;
    const displayUser = {
      ...member,
      displayName: serverProfile?.nickname || member.displayName,
      photoURL: serverProfile?.avatar || member.photoURL,
    };

    let activityText = member.customStatus || '';
    let ActivityIcon = null;
    if (member.currentGame) {
      activityText = `Playing ${member.currentGame.name}`;
      ActivityIcon = Gamepad2;
    } else if (member.currentSong) {
      activityText = `Listening to ${member.currentSong.title}`;
      ActivityIcon = Music;
    } else if (member.isBot) {
      activityText = "Bot"
      ActivityIcon = Bot;
    }

    return (
        <UserNav user={member as UserProfile} serverContext={server} as="trigger">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer relative overflow-hidden group/member">
                {member.nameplateUrl && (
                    <Image
                        src={member.nameplateUrl}
                        alt=""
                        fill
                        className="object-cover opacity-50 group-hover/member:opacity-75 transition-opacity"
                    />
                )}
                <div className="relative z-10 flex items-center gap-2 w-full">
                    <div className="relative">
                        <Avatar className="size-8">
                            <AvatarImage src={displayUser.photoURL || undefined} />
                            <AvatarFallback>{displayUser.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-secondary", 
                            statusConfig[status].color
                        )} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center">
                            <span className="font-medium text-sm truncate" style={{ color: topRoleColor }}>
                                {displayUser.displayName}
                            </span>
                             {isOwner && <Crown className="size-4 text-yellow-500 ml-1.5" />}
                        </div>
                        {activityText && (
                            <p className="text-xs truncate text-muted-foreground flex items-center gap-1.5">
                                {ActivityIcon && <ActivityIcon className="size-3"/>}
                                {activityText}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </UserNav>
    )
}
