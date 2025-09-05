
'use client';

import React, { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
} from "@/components/ui/alert-dialog"
import type { Server, Channel, ChannelType, Category } from '@/lib/types';
import { Hash, ChevronDown, Settings, Trash, Plus, MoreVertical, Pencil, Megaphone, ScrollText, MessageSquare, UserPlus, BadgeCheck, Users, GripVertical } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditServerDialog } from './edit-server-dialog';
import { AddChannelDialog } from './add-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InviteDialog } from './invite-dialog';
import { useChannelMessages } from '@/hooks/use-channel-messages';
import Image from 'next/image';
import { useChannels } from '@/hooks/use-channels';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useToast } from '@/hooks/use-toast';


const channelIcons: Record<ChannelType, React.ElementType> = {
    text: Hash,
    announcement: Megaphone,
    rules: ScrollText,
    forum: MessageSquare,
};

const SortableChannelItem = ({ channel, server, isOwner, selectedChannel, onSelectChannel, onUpdateChannel, onDeleteChannel }: {
    channel: Channel;
    server: Server;
    isOwner: boolean;
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
    onDeleteChannel: (channelId: string) => Promise<void>;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: channel.id });
    const { authUser } = useAuth();
    const { messages } = useChannelMessages(channel.serverId, channel.id);

    const hasUnreadMention = useMemo(() => {
        if (!authUser) return false;
        if (selectedChannel?.id === channel.id) return false;
        return messages.some(msg => msg.mentions?.includes(authUser.uid));
    }, [messages, authUser, selectedChannel, channel.id]);

    const Icon = channelIcons[channel.type] || Hash;
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <SidebarMenuItem ref={setNodeRef} style={style} className="px-2 group/channel flex items-center gap-1">
             {isOwner && <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground/50"><GripVertical className="size-4" /></button>}
            <SidebarMenuButton
                isActive={selectedChannel?.id === channel.id}
                onClick={() => onSelectChannel(channel)}
                className={cn(
                    "w-full justify-start h-8 px-2",
                    hasUnreadMention && "text-white font-bold",
                    !isOwner && 'ml-6' // Indent if not owner (no drag handle)
                )}
            >
                <Icon className="size-4 text-muted-foreground" />
                <span className="truncate">{channel.name}</span>
            </SidebarMenuButton>

            {hasUnreadMention && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-r-full" />}

            {isOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/channel:opacity-100">
                            <MoreVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                        <EditChannelDialog channel={channel} server={server} onUpdateChannel={onUpdateChannel}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit Channel</span>
                            </DropdownMenuItem>
                        </EditChannelDialog>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={channel.name === 'general'}
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    <span>Delete Channel</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete #{channel.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to permanently delete this channel? This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteChannel(channel.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </SidebarMenuItem>
    );
};


export function ServerSidebar({ server, selectedChannel, onSelectChannel, onUpdateServer, onDeleteServer }: ServerSidebarProps) {
    const { user: currentUser } = useAuth();
    const { createChannel, updateChannel, deleteChannel, updateChannelOrder, updateCategoryOrder } = useChannels(server.id);
    const { toast } = useToast();
    const isOwner = currentUser?.uid === server.ownerId;
    const isHeina = currentUser?.displayName === 'heina';

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleToggleVerify = () => {
        onUpdateServer(server.id, { isVerified: !server.isVerified });
    }

    const handleChannelDragEnd = async (event: DragEndEvent, categoryId: string) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const category = server.categories.find(c => c.id === categoryId);
            if (!category) return;
            const oldIndex = category.channels.findIndex(c => c.id === active.id);
            const newIndex = category.channels.findIndex(c => c.id === over.id);
            const reorderedChannels = arrayMove(category.channels, oldIndex, newIndex);
            
            toast({ title: "Reordering channels...", description: "Please wait." });
            await updateChannelOrder(reorderedChannels.map(c => c.id), categoryId);
            toast({ title: "Success", description: "Channel order updated." });
        }
    };
    
    const handleCategoryDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = server.categories.findIndex(c => c.id === active.id);
            const newIndex = server.categories.findIndex(c => c.id === over.id);
            const reorderedCategories = arrayMove(server.categories, oldIndex, newIndex);
            
            toast({ title: "Reordering categories...", description: "Please wait." });
            await updateCategoryOrder(reorderedCategories.map(c => c.id));
            toast({ title: "Success", description: "Category order updated." });
        }
    }

    const sortedCategories = useMemo(() => {
        return [...(server.categories || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
    }, [server.categories]);


    const renderHeader = () => (
        <div className="border-b shadow-sm relative">
            {server.bannerURL && (
                <div className="h-24 w-full relative">
                    <Image src={server.bannerURL} alt={`${server.name} banner`} fill style={{objectFit: 'cover'}}/>
                </div>
            )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "p-4 w-full text-left hover:bg-accent/50 transition-colors",
                         server.bannerURL && "absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 text-white"
                        )}>
                        <div className="flex items-center gap-2">
                             {server.isVerified && <BadgeCheck className="size-5 text-blue-400 shrink-0" />}
                            <CardTitle className={cn("truncate text-lg", server.bannerURL && "text-shadow-md")}>{server.name}</CardTitle>
                            <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground", server.bannerURL && "text-white/80")} />
                        </div>
                        <CardDescription className={cn("flex items-center gap-1 text-xs ml-1", server.bannerURL && "text-white/70")}>
                            {server.description ? (
                                <span className="truncate">{server.description}</span>
                            ) : (
                                <>
                                    <Users className="size-3"/> {server.members?.length || 0} Members
                                </>
                            )}
                        </CardDescription>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                    <InviteDialog serverId={server.id}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-indigo-400 focus:bg-indigo-500/20 focus:text-indigo-300">
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Invite People</span>
                        </DropdownMenuItem>
                    </InviteDialog>
                    {isHeina && (
                         <DropdownMenuItem onSelect={handleToggleVerify}>
                            <BadgeCheck className="mr-2 h-4 w-4" />
                            <span>{server.isVerified ? 'Unverify Server' : 'Verify Server'}</span>
                        </DropdownMenuItem>
                    )}
                    {isOwner && (
                        <>
                            <DropdownMenuSeparator />
                            <EditServerDialog server={server} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Server Settings</span>
                                </DropdownMenuItem>
                            </EditServerDialog>
                        </>
                    )}
                     <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Leave Server</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-card/40">
            {renderHeader()}
            <div className="p-0 flex-1 overflow-y-auto">
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                    <SortableContext items={sortedCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {sortedCategories.map((category) => (
                           <SortableCategoryItem 
                             key={category.id} 
                             category={category}
                             server={server}
                             isOwner={isOwner}
                             selectedChannel={selectedChannel}
                             onSelectChannel={onSelectChannel}
                             onUpdateChannel={updateChannel}
                             onDeleteChannel={deleteChannel}
                             onCreateChannel={createChannel}
                             onChannelDragEnd={handleChannelDragEnd}
                             sensors={sensors}
                           />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}


const SortableCategoryItem = ({ category, server, isOwner, selectedChannel, onSelectChannel, onUpdateChannel, onDeleteChannel, onCreateChannel, onChannelDragEnd, sensors }: {
    category: Category;
    server: Server;
    isOwner: boolean;
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
    onDeleteChannel: (channelId: string) => Promise<void>;
    onCreateChannel: (name: string, categoryId: string) => Promise<void>;
    onChannelDragEnd: (event: DragEndEvent, categoryId: string) => void;
    sensors: any;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id, disabled: !isOwner });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const sortedChannels = useMemo(() => {
        return [...(category.channels || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
    }, [category.channels]);

    return (
        <div ref={setNodeRef} style={style}>
            <Collapsible defaultOpen={true}>
                <SidebarGroup className="py-2">
                    <div className="flex items-center group/category">
                        {isOwner && (
                            <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground/50">
                                <GripVertical className="size-4" />
                            </button>
                        )}
                        <CollapsibleTrigger asChild>
                            <SidebarGroupLabel className={cn("flex-1", !isOwner && 'ml-6')}>
                                <ChevronDown className="size-3 mr-1 transition-transform group-data-[state=open]/category:rotate-0 -rotate-90"/>
                                {category.name}
                            </SidebarGroupLabel>
                        </CollapsibleTrigger>
                        {isOwner && (
                            <AddChannelDialog categoryId={category.id} onCreateChannel={onCreateChannel}>
                                <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover/category:opacity-100 mr-2">
                                    <Plus className="size-4" />
                                </button>
                            </AddChannelDialog>
                        )}
                    </div>
                     <CollapsibleContent>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onChannelDragEnd(e, category.id)}>
                            <SortableContext items={sortedChannels.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <SidebarMenu>
                                {sortedChannels.map((channel) => (
                                    <SortableChannelItem
                                        key={channel.id}
                                        channel={channel}
                                        server={server}
                                        isOwner={isOwner}
                                        selectedChannel={selectedChannel}
                                        onSelectChannel={onSelectChannel}
                                        onUpdateChannel={onUpdateChannel}
                                        onDeleteChannel={onDeleteChannel}
                                    />
                                ))}
                                </SidebarMenu>
                            </SortableContext>
                        </DndContext>
                    </CollapsibleContent>
                </SidebarGroup>
            </Collapsible>
        </div>
    );
};
