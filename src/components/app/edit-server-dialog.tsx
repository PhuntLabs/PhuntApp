
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
import type { Server, CustomEmoji } from '@/lib/types';
import { Globe, Trash, Smile, ImagePlus, X } from 'lucide-react';
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

export function EditServerDialog({ children, server, onUpdateServer, onDeleteServer }: EditServerDialogProps) {
  const [serverName, setServerName] = useState(server.name);
  const [serverIcon, setServerIcon] = useState(server.photoURL || '');
  const [isPublic, setIsPublic] = useState(server.isPublic || false);
  const [description, setDescription] = useState(server.description || '');
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>(server.customEmojis || []);
  
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiUrl, setNewEmojiUrl] = useState('');
  const [newEmojiFile, setNewEmojiFile] = useState<File | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const emojiFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile } = useAuth();
  
  useEffect(() => {
    if (server && isOpen) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
      setIsPublic(server.isPublic || false);
      setDescription(server.description || '');
      setCustomEmojis(server.customEmojis || []);
    }
  }, [server, isOpen]);

  const handleSave = async (e: React.FormEvent, tab: string) => {
    e.preventDefault();
    if (serverName.trim()) {
      setIsSaving(true);
      try {
        let updatedData: Partial<Omit<Server, 'id'>> = {};

        if (tab === 'general') {
            updatedData = { name: serverName.trim(), photoURL: serverIcon.trim() };
        } else if (tab === 'discovery') {
            updatedData = { isPublic, description };
        } else if (tab === 'emojis') {
            updatedData = { customEmojis };
        }
        
        await onUpdateServer(server.id, updatedData);
        setIsOpen(false);
        toast({ title: "Server Updated", description: "Your changes have been saved."});
      } catch (error) {
        console.error("Failed to update server", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update server." });
      } finally {
        setIsSaving(false);
      }
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
        setNewEmojiUrl(file.name); // show filename in url input
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Server Settings</DialogTitle>
          <DialogDescription>
            Manage settings for your server.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="discovery"><Globe className="size-4 mr-2"/> Discovery</TabsTrigger>
                <TabsTrigger value="emojis"><Smile className="size-4 mr-2"/> Emojis</TabsTrigger>
                <TabsTrigger value="danger-zone" className="text-destructive"><Trash className="size-4 mr-2"/> Danger</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
                <form onSubmit={(e) => handleSave(e, 'general')}>
                <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                    <Label htmlFor="server-name">
                        Server Name
                    </Label>
                    <Input
                        id="server-name"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        required
                    />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="server-icon">
                        Icon URL
                    </Label>
                    <Input
                        id="server-icon"
                        value={serverIcon}
                        onChange={(e) => setServerIcon(e.target.value)}
                        placeholder="https://image.url/icon.png"
                    />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
                </form>
            </TabsContent>

            <TabsContent value="discovery">
                 <form onSubmit={(e) => handleSave(e, 'discovery')}>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label>Make Discoverable</Label>
                                <DialogDescription>
                                Allow your server to be listed on the public discovery page.
                                </DialogDescription>
                            </div>
                            <Switch
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="description">Server Description</Label>
                             <Textarea 
                                id="description" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell everyone what your server is about!"
                                maxLength={300}
                                disabled={!isPublic}
                             />
                             <p className="text-xs text-muted-foreground">{description.length} / 300</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving} className="w-full">
                        {isSaving ? 'Saving...' : 'Save Discovery Settings'}
                        </Button>
                    </DialogFooter>
                </form>
            </TabsContent>
            
            <TabsContent value="emojis">
                 <form onSubmit={(e) => handleSave(e, 'emojis')}>
                    <div className="py-4 space-y-4">
                        <DialogDescription>
                            Add up to 10 custom emojis to your server.
                        </DialogDescription>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
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
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving} className="w-full">
                           {isSaving ? 'Saving...' : 'Save Emojis'}
                        </Button>
                    </DialogFooter>
                 </form>
            </TabsContent>
            
            <TabsContent value="danger-zone">
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
      </DialogContent>
    </Dialog>
  );
}
