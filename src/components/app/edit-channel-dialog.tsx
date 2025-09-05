
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Channel, ChannelType, Server, Permission } from '@/lib/types';
import { Hash, Megaphone, ScrollText, MessageSquare, Plus, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { allPermissionDetails } from '@/lib/permissions';
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EditChannelDialogProps {
  children: React.ReactNode;
  channel: Channel;
  server: Server;
  onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
}

const channelTypes: { value: ChannelType; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Text Channel', icon: Hash },
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'rules', label: 'Rules', icon: ScrollText },
  { value: 'forum', label: 'Forum', icon: MessageSquare },
];

export function EditChannelDialog({ children, channel, server, onUpdateChannel }: EditChannelDialogProps) {
  const [channelName, setChannelName] = useState(channel.name);
  const [channelType, setChannelType] = useState(channel.type || 'text');
  const [channelTopic, setChannelTopic] = useState(channel.topic || '');
  const [permissionOverwrites, setPermissionOverwrites] = useState(channel.permissionOverwrites || {});
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (channel && isOpen) {
      setChannelName(channel.name);
      setChannelType(channel.type || 'text');
      setChannelTopic(channel.topic || '');
      setPermissionOverwrites(channel.permissionOverwrites || {});
      setSelectedRole(null);
    }
  }, [channel, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      setIsLoading(true);
      try {
        const updateData: Partial<Channel> = {
            name: channelName.trim(), 
            type: channelType, 
            topic: channelTopic.trim(),
            permissionOverwrites
        };
        await onUpdateChannel(channel.id, updateData);
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to update channel", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePermissionChange = (roleId: string, permission: Permission, value: boolean | 'unset') => {
      setPermissionOverwrites(prev => {
          const newOverwrites = { ...prev };
          if (!newOverwrites[roleId]) {
              newOverwrites[roleId] = {};
          }
          if (value === 'unset') {
              delete newOverwrites[roleId][permission];
              // if role has no more overwrites, remove it
              if(Object.keys(newOverwrites[roleId]).length === 0) {
                  delete newOverwrites[roleId];
              }
          } else {
              newOverwrites[roleId][permission] = value;
          }
          return newOverwrites;
      })
  }
  
  const rolesWithOverwrites = useMemo(() => {
    const roleIds = new Set(Object.keys(permissionOverwrites));
    return server.roles?.filter(r => roleIds.has(r.id)) || [];
  }, [permissionOverwrites, server.roles]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="overview" className="flex-1 min-h-0">
             <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[calc(100%-80px)] mt-4">
                 <form onSubmit={handleSubmit} className="pr-4">
                    <TabsContent value="overview">
                        <div className="grid gap-4 py-4">
                             <div className="space-y-2">
                              <Label htmlFor="channel-name">Channel Name</Label>
                              <Input
                                id="channel-name"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                required
                              />
                            </div>
                             <div className="space-y-2">
                              <Label htmlFor="channel-topic">Channel Topic</Label>
                              <Textarea
                                id="channel-topic"
                                value={channelTopic}
                                onChange={(e) => setChannelTopic(e.target.value)}
                                placeholder="Let everyone know what this channel is about"
                                maxLength={1024}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Channel Type</Label>
                              <Select value={channelType} onValueChange={(value) => setChannelType(value as ChannelType)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a channel type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {channelTypes.map(({ value, label, icon: Icon }) => (
                                    <SelectItem key={value} value={value}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="size-4" />
                                        <span>{label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                        </div>
                    </TabsContent>
                     <TabsContent value="permissions">
                        <div className="space-y-4 py-4">
                            <Label>Role Permissions</Label>
                            <div className="space-y-2">
                                {rolesWithOverwrites.map(role => (
                                    <div key={role.id} className="flex items-center justify-between p-2 rounded-md border" style={{ borderColor: role.color }}>
                                        <span className="font-medium" style={{ color: role.color }}>{role.name}</span>
                                        <Button size="sm" variant="outline" onClick={() => setSelectedRole(role.id)}>Edit</Button>
                                    </div>
                                ))}
                            </div>
                            <Select onValueChange={(roleId) => setSelectedRole(roleId)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Add overwrite for a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {server.roles?.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                             {selectedRole && (
                                <div className="p-4 border rounded-lg mt-4">
                                    <h3 className="font-semibold mb-4">Editing: {server.roles?.find(r => r.id === selectedRole)?.name}</h3>
                                    <div className="space-y-3">
                                        {allPermissionDetails.map(perm => {
                                            const roleOverwrite = permissionOverwrites[selectedRole]?.[perm.id];
                                            const state: 'allow' | 'deny' | 'inherit' = roleOverwrite === true ? 'allow' : roleOverwrite === false ? 'deny' : 'inherit';

                                            return (
                                                <div key={perm.id} className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-medium">{perm.name}</p>
                                                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => handlePermissionChange(selectedRole, perm.id, false)} className={cn("size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive", state === 'deny' && 'bg-destructive/20 text-destructive')}>
                                                          <X className="size-4"/>
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handlePermissionChange(selectedRole, perm.id, 'unset')} className={cn("size-8", state === 'inherit' && 'bg-accent')}>
                                                          <div className="w-3 h-0.5 bg-current"/>
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handlePermissionChange(selectedRole, perm.id, true)} className={cn("size-8 text-muted-foreground hover:bg-green-500/10 hover:text-green-500", state === 'allow' && 'bg-green-500/20 text-green-500')}>
                                                           <Hash className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                     </TabsContent>
                     <DialogFooter className="sticky bottom-0 bg-background py-4">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !channelName.trim()}>
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                 </form>
            </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
