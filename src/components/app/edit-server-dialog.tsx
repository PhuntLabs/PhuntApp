'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Server, CustomEmoji, Role, Permission, UserProfile } from '@/lib/types';
import { Globe, Trash, Smile, ImagePlus, X, Palette, GripVertical, Plus, ShieldQuestion, Users, Search } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { allPermissionDetails } from '@/lib/permissions';
import { ScrollArea } from '../ui/scroll-area';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';

function generateRandomHexColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

const SortableRoleItem = ({ role, index, onRemove, onSelect, selectedRole, canBeRemoved }: { role: Role, index: number, onRemove: (index: number) => void, onSelect: (id: string) => void, selectedRole: string | null, canBeRemoved: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: role.id});
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} >
            <div onClick={() => onSelect(role.id)} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent" data-active={selectedRole === role.id}>
                <button {...listeners} className="cursor-grab text-muted-foreground p-1"><GripVertical className="size-5 "/></button>
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: role.color }} />
                <span className="flex-1" style={{ color: role.color }}>{role.name}</span>
                {canBeRemoved && (
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={(e) => {e.stopPropagation(); onRemove(index)}}>
                        <X className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};


interface EditServerDialogProps {
  children: React.ReactNode;
  server: Server;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
  members: Partial<UserProfile>[];
}

export function EditServerDialog({ children, server, onUpdateServer, onDeleteServer, members }: EditServerDialogProps) {
  const [serverName, setServerName] = useState(server.name);
  const [serverIcon, setServerIcon] = useState(server.photoURL || '');
  const [serverBanner, setServerBanner] = useState(server.bannerURL || '');
  const [isPublic, setIsPublic] = useState(server.isPublic || false);
  const [description, setDescription] = useState(server.description || '');
  const [inviteLink, setInviteLink] = useState(server.customInviteLink || '');
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>(server.customEmojis || []);
  const [roles, setRoles] = useState<Role[]>(server.roles || []);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [systemChannelId, setSystemChannelId] = useState<string | undefined>(server.systemChannelId);
  const [memberSearch, setMemberSearch] = useState('');
  
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiUrl, setNewEmojiUrl] = useState('');
  const [newEmojiFile, setNewEmojiFile] = useState<File | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const emojiFileRef = useRef<HTMLInputElement>(null);
  const { uploadFile, updateUserRolesInServer } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (server && isOpen) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
      setServerBanner(server.bannerURL || '');
      setIsPublic(server.isPublic || false);
      setDescription(server.description || '');
      setInviteLink(server.customInviteLink || '');
      setCustomEmojis(server.customEmojis || []);
      setSystemChannelId(server.systemChannelId);
      
      const serverRoles = [...(server.roles || [])];
      serverRoles.sort((a, b) => a.priority - b.priority);

      setRoles(serverRoles);
      setSelectedRole(serverRoles[0]?.id || null);
    }
  }, [server, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const rolesWithUpdatedPriority = roles.map((role, index) => ({...role, priority: index }));

        const updatedData: Partial<Omit<Server, 'id'>> = { 
            name: serverName.trim(), 
            photoURL: serverIcon.trim(), 
            bannerURL: serverBanner.trim(),
            customInviteLink: inviteLink.trim(),
            isPublic, 
            description,
            customEmojis,
            roles: rolesWithUpdatedPriority,
            systemChannelId,
        };
        
        await onUpdateServer(server.id, updatedData);
        toast({ title: "Server Updated", description: "Your changes have been saved."});
        
    } catch (error: any) {
        console.error("Failed to update server", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update server." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await onDeleteServer(server.id);
        setIsOpen(false);
    } catch (error) {
        console.error("Failed to delete server", error);
    } finally {
        setIsDeleting(false);
    }
  }

  const handleAddEmoji = async () => {
    if (!newEmojiName.trim()) {
        toast({ variant: 'destructive', title: 'Emoji name is required.'});
        return;
    }
    if (customEmojis.length >= 10) {
        toast({ variant: 'destructive', title: 'Maximum of 10 custom emojis reached.'});
        return;
    }

    let emojiUrl = newEmojiUrl.trim();

    if (newEmojiFile) {
        setIsSaving(true);
        try {
            emojiUrl = await uploadFile(newEmojiFile, `server-emojis/${server.id}`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload emoji file.' });
            setIsSaving(false);
            return;
        }
        setIsSaving(false);
    }

    if (!emojiUrl) {
         toast({ variant: 'destructive', title: 'Emoji image is required.'});
         return;
    }

    setCustomEmojis([...customEmojis, { name: newEmojiName.trim(), url: emojiUrl }]);
    setNewEmojiName('');
    setNewEmojiUrl('');
    setNewEmojiFile(null);
    if(emojiFileRef.current) emojiFileRef.current.value = "";
  }

  const handleRemoveEmoji = (index: number) => {
    setCustomEmojis(customEmojis.filter((_, i) => i !== index));
  }
  
  const handleEmojiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewEmojiFile(file);
        setNewEmojiUrl(file.name);
    }
  }
  
  const handleAddRole = () => {
      const newRole: Role = {
          id: `role_${Date.now()}`,
          name: 'new role',
          color: generateRandomHexColor(),
          priority: roles.length, 
          permissions: {}
      };
      setRoles(prev => [...prev, newRole]);
  }

  const handleUpdateRole = (roleId: string, updatedRole: Partial<Role>) => {
      setRoles(prev => prev.map(role => role.id === roleId ? { ...role, ...updatedRole } : role));
  }
  
  const handleRemoveRole = (index: number) => {
      const roleToRemove = roles[index];
      if (selectedRole === roleToRemove.id) {
          setSelectedRole(roles[0]?.id || null);
      }
      setRoles(roles.filter((_, i) => i !== index));
  }

  const handlePermissionChange = (roleId: string, permission: Permission, value: boolean) => {
      const roleIndex = roles.findIndex(r => r.id === roleId);
      if (roleIndex === -1) return;

      const newRoles = [...roles];
      if (!newRoles[roleIndex].permissions) {
        newRoles[roleIndex].permissions = {};
      }
      newRoles[roleIndex].permissions[permission] = value;
      setRoles(newRoles);
  }

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (event: any) => {
      const {active, over} = event;
      if (active.id !== over.id) {
          setRoles((items) => {
              const oldIndex = items.findIndex(item => item.id === active.id);
              const newIndex = items.findIndex(item => item.id === over.id);
              return arrayMove(items, oldIndex, newIndex);
          });
      }
  };
  
  const handleMemberRoleChange = async (memberId: string, roleId: string, isChecked: boolean) => {
      const memberDetails = server.memberDetails[memberId];
      if (!memberDetails) return;

      const currentRoles = memberDetails.roles || [];
      const newRoles = isChecked
          ? [...currentRoles, roleId]
          : currentRoles.filter(id => id !== roleId);
      
      try {
          await updateUserRolesInServer(server.id, memberId, newRoles);
          // Note: The UI will update automatically via the onSnapshot listener in useServer.
          // This is a "fire-and-forget" and we don't need to manually update local state here.
          toast({ title: 'Roles updated', description: `Updated roles for the user.`});
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update roles.' });
      }
  };

  const activeRoleForEditing = roles.find(r => r.id === selectedRole);
  const textChannels = server.channels?.filter(c => c.type === 'text') || [];

  const filteredMembers = members.filter(member => 
      member.displayName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Server Settings: {server.name}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 flex-1 min-h-0">
            <aside className="w-52 flex-shrink-0">
                 <Tabs defaultValue={activeTab} onValueChange={setActiveTab} orientation="vertical">
                    <TabsList className="w-full h-auto flex-col items-start bg-transparent p-0">
                        <TabsTrigger value="general" className="w-full justify-start data-[state=active]:bg-accent">Overview</TabsTrigger>
                        <TabsTrigger value="roles" className="w-full justify-start data-[state=active]:bg-accent">Roles</TabsTrigger>
                        <TabsTrigger value="emojis" className="w-full justify-start data-[state=active]:bg-accent">Emojis</TabsTrigger>
                        <TabsTrigger value="members" className="w-full justify-start data-[state=active]:bg-accent">Members</TabsTrigger>
                        <TabsTrigger value="discovery" className="w-full justify-start data-[state=active]:bg-accent">Discovery</TabsTrigger>
                        <Separator className="my-2"/>
                        <TabsTrigger value="danger-zone" className="w-full justify-start text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">Delete Server</TabsTrigger>
                    </TabsList>
                 </Tabs>
            </aside>
            <main className="flex-1 overflow-y-auto pr-2 border-l pl-4">
                 <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
                    <TabsContent value="general" className="mt-0">
                        <div className="grid gap-4 py-4">
                             <div className="space-y-1">
                                <Label htmlFor="server-name">Server Name</Label>
                                <Input id="server-name" value={serverName} onChange={(e) => setServerName(e.target.value)} required/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="server-icon">Icon URL</Label>
                                <Input id="server-icon" value={serverIcon} onChange={(e) => setServerIcon(e.target.value)} placeholder="https://image.url/icon.png"/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="server-banner">Banner URL</Label>
                                <Input id="server-banner" value={serverBanner} onChange={(e) => setServerBanner(e.target.value)} placeholder="https://image.url/banner.png"/>
                            </div>
                            <Separator />
                             <div className="space-y-1">
                                <Label htmlFor="system-channel">System Messages Channel</Label>
                                <DialogDescription>
                                    The channel where system messages like welcome messages will be sent.
                                </DialogDescription>
                                <Select value={systemChannelId} onValueChange={(value) => setSystemChannelId(value)}>
                                    <SelectTrigger id="system-channel">
                                        <SelectValue placeholder="Select a channel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {textChannels.map(channel => (
                                            <SelectItem key={channel.id} value={channel.id}>#{channel.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <Label htmlFor="invite-link">Custom Invite Link</Label>
                                <div className="flex items-center">
                                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">/join/</span>
                                    <Input id="invite-link" value={inviteLink} onChange={(e) => setInviteLink(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))} placeholder="my-cool-server" className="rounded-l-none"/>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="roles" className="mt-0 space-y-4 py-4">
                        <DialogDescription>
                            Use roles to group your server members and assign permissions. Drag to reorder.
                        </DialogDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="space-y-2">
                                 <div className="flex items-center justify-between">
                                    <Label>Roles</Label>
                                    <Button size="sm" variant="outline" onClick={handleAddRole}><Plus className="size-4 mr-2"/> Add</Button>
                                </div>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={roles} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                        {roles.map((role, index) => (
                                            <SortableRoleItem 
                                                key={role.id}
                                                role={role}
                                                index={index}
                                                onRemove={handleRemoveRole}
                                                onSelect={setSelectedRole}
                                                selectedRole={selectedRole}
                                                canBeRemoved={true}
                                            />
                                        ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                            <ScrollArea className="h-[60vh]">
                            <div className="space-y-4 border rounded-lg p-4">
                                {activeRoleForEditing ? (
                                <>
                                    <h4 className="font-semibold">Editing: <span style={{ color: activeRoleForEditing?.color }}>{activeRoleForEditing?.name}</span></h4>
                                    <div className="space-y-2">
                                        <Label>Role Name</Label>
                                        <Input value={activeRoleForEditing.name} onChange={(e) => handleUpdateRole(activeRoleForEditing.id, { name: e.target.value })}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role Color</Label>
                                        <Input type="color" value={activeRoleForEditing.color} onChange={(e) => handleUpdateRole(activeRoleForEditing.id, { color: e.target.value })} className="w-full h-10 p-1"/>
                                    </div>
                                    <Separator/>
                                    <h4 className="font-semibold">Permissions</h4>
                                    <div className="space-y-3">
                                        {allPermissionDetails.map(perm => {
                                            return (
                                            <div key={perm.id} className="flex items-center justify-between space-x-2">
                                                <div className="grid gap-1.5 leading-none">
                                                    <label htmlFor={`perm-${perm.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {perm.name}
                                                    </label>
                                                </div>
                                                 <Switch
                                                    id={`perm-${perm.id}`}
                                                    checked={activeRoleForEditing.permissions?.[perm.id] || false}
                                                    onCheckedChange={(checked) => handlePermissionChange(activeRoleForEditing.id, perm.id, !!checked)}
                                                    disabled={activeRoleForEditing.permissions?.['administrator'] && perm.id !== 'administrator'}
                                                />
                                            </div>
                                        )})}
                                    </div>
                                </>
                                ) : (
                                    <div className="text-center text-muted-foreground py-10">
                                        <p>Select a role to edit.</p>
                                    </div>
                                )}
                            </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="discovery" className="mt-0">
                        <div className="py-4 space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Make Discoverable</Label>
                                    <DialogDescription>
                                    Allow your server to be listed on the public discovery page.
                                    </DialogDescription>
                                </div>
                                <Switch checked={isPublic} onCheckedChange={setIsPublic}/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Server Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell everyone what your server is about!" maxLength={300} disabled={!isPublic}/>
                                <p className="text-xs text-muted-foreground">{description.length} / 300</p>
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="emojis" className="mt-0">
                        <div className="py-4 space-y-4">
                            <DialogDescription>
                                Add up to 10 custom emojis to your server.
                            </DialogDescription>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {customEmojis.map((emoji, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Image src={emoji.url} alt={emoji.name} width={32} height={32} className="rounded-sm" />
                                            <code className="text-sm">:{emoji.name}:</code>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveEmoji(index)} className="size-7 text-muted-foreground">
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            
                            {customEmojis.length < 10 && (
                                <div className="p-3 border rounded-lg space-y-3">
                                    <h4 className="font-semibold text-sm">Add Emoji</h4>
                                    <div className="flex items-end gap-2">
                                        <div className="space-y-1.5 flex-1">
                                            <Label htmlFor="emoji-name">Emoji Name</Label>
                                            <Input id="emoji-name" value={newEmojiName} onChange={(e) => setNewEmojiName(e.target.value)} placeholder="e.g. happycat"/>
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <Label htmlFor="emoji-url">Emoji URL or Upload</Label>
                                            <div className="flex gap-2">
                                                <Input id="emoji-url" value={newEmojiUrl} onChange={(e) => { setNewEmojiUrl(e.target.value); setNewEmojiFile(null); }} disabled={!!newEmojiFile} placeholder="https://..."/>
                                                <Button type="button" variant="outline" size="icon" onClick={() => emojiFileRef.current?.click()}><ImagePlus className="size-4"/></Button>
                                                <input type="file" ref={emojiFileRef} className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleEmojiFileChange} />
                                            </div>
                                        </div>
                                        <Button type="button" onClick={handleAddEmoji} disabled={isSaving}>Add</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    
                     <TabsContent value="members" className="mt-0">
                        <DialogDescription className="py-4">
                            Manage server members and their roles.
                        </DialogDescription>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search members..." 
                                className="pl-10 mb-4"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[55vh]">
                            <div className="space-y-2 pr-4">
                                {filteredMembers.map(member => (
                                    <div key={member.uid} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent">
                                        <Avatar>
                                            <AvatarImage src={member.photoURL || undefined} />
                                            <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold">{member.displayName}</p>
                                            <p className="text-xs text-muted-foreground">@{member.displayName_lowercase}</p>
                                        </div>
                                        <Select onValueChange={(roleId) => handleMemberRoleChange(member.uid!, roleId, !server.memberDetails[member.uid!]?.roles.includes(roleId))}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Manage Roles" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(role => (
                                                    <div key={role.id} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                                            <Checkbox
                                                                checked={server.memberDetails[member.uid!]?.roles.includes(role.id)}
                                                                onCheckedChange={(checked) => handleMemberRoleChange(member.uid!, role.id, !!checked)}
                                                            />
                                                        </span>
                                                        {role.name}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="danger-zone" className="mt-0">
                        <div className="py-4 space-y-4">
                            <h3 className="font-semibold text-destructive">Delete Server</h3>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete the <span className="font-bold">{server.name}</span> server. This action cannot be undone.
                            </p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full justify-between">
                                        Delete Server <Trash className="size-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        <span className="font-bold"> {server.name} </span>
                                        server and all of its data.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                        {isDeleting ? 'Deleting...' : 'Yes, delete server'}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TabsContent>
                 </Tabs>
            </main>
        </div>
        <DialogFooter className="border-t pt-4 mt-auto flex sm:justify-between">
            <div>
                 <Button variant="ghost" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
