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
import type { Server, CustomEmoji, Role } from '@/lib/types';
import { Globe, Trash, Smile, ImagePlus, X, Palette, GripVertical, Plus } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface EditServerDialogProps {
  children: React.ReactNode;
  server: Server;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
}

function generateRandomHexColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

export function EditServerDialog({ children, server, onUpdateServer, onDeleteServer }: EditServerDialogProps) {
  const [serverName, setServerName] = useState(server.name);
  const [serverIcon, setServerIcon] = useState(server.photoURL || '');
  const [isPublic, setIsPublic] = useState(server.isPublic || false);
  const [description, setDescription] = useState(server.description || '');
  const [inviteLink, setInviteLink] = useState(server.customInviteLink || '');
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>(server.customEmojis || []);
  const [roles, setRoles] = useState<Role[]>(server.roles || []);
  
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiUrl, setNewEmojiUrl] = useState('');
  const [newEmojiFile, setNewEmojiFile] = useState<File | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const emojiFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile } = useAuth();
  
  useEffect(() => {
    if (server && isOpen) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
      setIsPublic(server.isPublic || false);
      setDescription(server.description || '');
      setInviteLink(server.customInviteLink || '');
      setCustomEmojis(server.customEmojis || []);
      setRoles(server.roles || [{ id: 'default', name: '@everyone', color: '#99AAB5', priority: 99 }]);
    }
  }, [server, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        let updatedData: Partial<Omit<Server, 'id'>> = {};
        
        switch (activeTab) {
            case 'general':
                updatedData = { name: serverName.trim(), photoURL: serverIcon.trim(), customInviteLink: inviteLink.trim() };
                break;
            case 'discovery':
                updatedData = { isPublic, description };
                break;
            case 'emojis':
                updatedData = { customEmojis };
                break;
            case 'roles':
                updatedData = { roles };
                break;
            default:
                break;
        }
        
        if (Object.keys(updatedData).length > 0) {
            await onUpdateServer(server.id, updatedData);
            toast({ title: "Server Updated", description: "Your changes have been saved."});
        }
        setIsOpen(false);
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
          priority: roles.length
      };
      setRoles([...roles, newRole]);
  }

  const handleUpdateRole = (index: number, updatedRole: Partial<Role>) => {
      const newRoles = [...roles];
      newRoles[index] = { ...newRoles[index], ...updatedRole };
      setRoles(newRoles);
  }
  
  const handleRemoveRole = (index: number) => {
      setRoles(roles.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Server Settings: {server.name}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
            <div className="w-48 flex-shrink-0">
                 <Tabs defaultValue={activeTab} onValueChange={setActiveTab} orientation="vertical">
                    <TabsList className="w-full h-auto flex-col items-start bg-transparent p-0">
                        <TabsTrigger value="general" className="w-full justify-start data-[state=active]:bg-accent">General</TabsTrigger>
                        <TabsTrigger value="roles" className="w-full justify-start data-[state=active]:bg-accent">Roles</TabsTrigger>
                        <TabsTrigger value="emojis" className="w-full justify-start data-[state=active]:bg-accent">Emojis</TabsTrigger>
                        <TabsTrigger value="discovery" className="w-full justify-start data-[state=active]:bg-accent">Discovery</TabsTrigger>
                        <Separator className="my-2"/>
                        <TabsTrigger value="danger-zone" className="w-full justify-start text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">Danger Zone</TabsTrigger>
                    </TabsList>
                 </Tabs>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2">
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
                    
                    <TabsContent value="roles" className="mt-0 space-y-4">
                        <DialogDescription>
                            Use roles to group your server members and assign permissions.
                        </DialogDescription>
                        <div className="flex items-center justify-between">
                            <Label>Roles</Label>
                            <Button size="sm" variant="outline" onClick={handleAddRole}><Plus className="size-4 mr-2"/> Add Role</Button>
                        </div>
                        <div className="space-y-2">
                            {roles.map((role, index) => (
                                <div key={role.id} className="flex items-center gap-2 p-2 border rounded-md">
                                    <GripVertical className="size-5 text-muted-foreground cursor-grab"/>
                                    <Input type="color" value={role.color} onChange={(e) => handleUpdateRole(index, { color: e.target.value })} className="p-1 h-8 w-10"/>
                                    <Input value={role.name} onChange={(e) => handleUpdateRole(index, { name: e.target.value })} className="h-8"/>
                                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => handleRemoveRole(index)} disabled={role.id === 'default'}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ))}
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
            </div>
        </div>
        <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    