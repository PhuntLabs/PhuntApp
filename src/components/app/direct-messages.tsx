
'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot, X, CircleDot, Moon, XCircle, MessageCircleMore, Gamepad2 } from 'lucide-react';
import type { PopulatedChat, UserProfile, UserStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { AddUserDialog } from './add-user-dialog';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

interface DirectMessagesProps {
  directMessages: PopulatedChat[];
  selectedChat: PopulatedChat | null;
  onSelectChat: (chat: PopulatedChat) => void;
  onAddUser: (username: string) => void;
  onAddBot: () => void;
  onDeleteChat: (chatId: string) => void;
  loading: boolean;
}

const statusConfig: Record<UserStatus, { label: string; icon: React.ElementType, color: string }> = {
    online: { label: 'Online', icon: CircleDot, color: 'bg-green-500' },
    idle: { label: 'Idle', icon: Moon, color: 'bg-yellow-500' },
    dnd: { label: 'Do Not Disturb', icon: XCircle, color: 'bg-red-500' },
    offline: { label: 'Offline', icon: CircleDot, color: 'bg-gray-500' },
};

const ActiveNowCard = ({ user }: { user: Partial<UserProfile> }) => {
    if (!user.currentGame) return null;
    const game = user.currentGame;

    return (
        <div className="w-40 shrink-0">
            <div className="aspect-video rounded-lg relative overflow-hidden bg-accent group">
                 { "logoUrl" in game && game.logoUrl ? (
                    <Image src={game.logoUrl} alt={game.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                ) : "imageUrl" in game && game.imageUrl ? (
                     <Image src={game.imageUrl} alt={game.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                ): <div className="w-full h-full bg-accent flex items-center justify-center"><Gamepad2 className="size-8 text-muted-foreground"/></div>}
                <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm p-1.5">
                    <div className="flex items-center gap-2">
                        <Avatar className="size-5">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-semibold truncate text-white">{user.displayName}</p>
                    </div>
                </div>
            </div>
            <p className="font-semibold text-sm truncate mt-1">{game.name}</p>
        </div>
    )
}

export function DirectMessages({ directMessages, selectedChat, onSelectChat, onAddUser, onAddBot, onDeleteChat, loading }: DirectMessagesProps) {
  const { user } = useAuth();
  
  if (loading) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
                Direct Messages
            </SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuSkeleton showIcon={true} />
                <SidebarMenuSkeleton showIcon={true} />
            </SidebarMenu>
        </SidebarGroup>
    );
  }

  const activeUsers = directMessages
    .map(c => c.members.find(m => m.id !== user?.uid && m.currentGame))
    .filter(Boolean) as UserProfile[];
  
  return (
    <>
      {activeUsers.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Active Now</SidebarGroupLabel>
            <ScrollArea orientation="horizontal" className="w-full py-2">
                <div className="flex gap-3 px-2">
                    {activeUsers.map(user => (
                        <ActiveNowCard key={user.uid} user={user} />
                    ))}
                </div>
            </ScrollArea>
          </SidebarGroup>
      )}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          Direct Messages
          <AddUserDialog onAddUser={onAddUser} onAddBot={onAddBot}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </AddUserDialog>
        </SidebarGroupLabel>
        <SidebarMenu>
          {directMessages.map((chat) => {
            const otherMember = chat.members.find(m => m.id !== user?.uid);
            const chatName = otherMember?.displayName || chat.name || 'Chat';
            const chatAvatar = otherMember?.photoURL || chat.photoURL;
            const isBotChat = otherMember?.isBot;
            const status = otherMember?.status || 'offline';
            
            let subtext = statusConfig[status].label;
            let SubIcon = null;

            if (otherMember?.currentGame) {
              subtext = `Playing ${otherMember.currentGame.name}`;
              SubIcon = Gamepad2;
            } else if (otherMember?.customStatus) {
              subtext = otherMember.customStatus;
            }


            const hasUnread = chat.unreadCount && chat.unreadCount[user?.uid || ''] > 0;
            
            return (
              <SidebarMenuItem key={chat.id} className="group/item">
                 {hasUnread && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-1 bg-white rounded-r-full" />}
                <SidebarMenuButton
                  tooltip={chatName}
                  isActive={selectedChat?.id === chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn("h-auto py-1.5 relative overflow-hidden", hasUnread && "text-white font-semibold")}
                >
                   {otherMember?.nameplateUrl && (
                      <Image
                          src={otherMember.nameplateUrl}
                          alt=""
                          fill
                          className="object-cover opacity-30 group-hover:opacity-50 transition-opacity"
                          data-ai-hint="cityscape background"
                      />
                   )}
                  <div className="relative z-10 flex items-center gap-2 w-full">
                      <div className="relative">
                        <Avatar className="size-8 rounded-full relative">
                          <AvatarImage src={chatAvatar || undefined} />
                          <AvatarFallback>{chatName[0]}</AvatarFallback>
                        </Avatar>
                         <div className={cn(
                              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-secondary/30",
                              statusConfig[status].color
                          )} />
                      </div>
                      <div className="flex-1 overflow-hidden -space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("truncate", otherMember?.nameplateUrl ? 'text-white' : '')}>{chatName}</span>
                          {isBotChat && (
                              <Badge variant="secondary" className="h-4 px-1 flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                <Bot className="size-2.5" /> BOT
                              </Badge>
                          )}
                        </div>
                        <p className={cn("text-xs truncate flex items-center gap-1", hasUnread ? "text-white/70" : otherMember?.nameplateUrl ? "text-white/80" : "text-muted-foreground")}>
                          {SubIcon && <SubIcon className="size-3 shrink-0"/>}
                          {subtext}
                        </p>
                      </div>
                  </div>
                </SidebarMenuButton>

                  {hasUnread && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center z-20">
                          {chat.unreadCount?.[user?.uid || ''] > 9 ? '9+' : chat.unreadCount?.[user?.uid || '']}
                      </div>
                  )}

                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-foreground z-20">
                          <X className="h-3 w-3"/>
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Leave '{chatName}'?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Are you sure you want to remove this conversation? This action cannot be undone.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteChat(chat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Leave
                      </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                  </AlertDialog>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
