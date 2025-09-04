'use client';

import { useState, useEffect } from 'react';
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
import type { Server } from '@/lib/types';
import { Globe, Trash } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (server && isOpen) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
      setIsPublic(server.isPublic || false);
      setDescription(server.description || '');
    }
  }, [server, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serverName.trim()) {
      setIsSaving(true);
      try {
        await onUpdateServer(server.id, { 
            name: serverName.trim(), 
            photoURL: serverIcon.trim(),
            isPublic,
            description
        });
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to update server", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Server Settings</DialogTitle>
          <DialogDescription>
            Manage settings for your server.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="discovery"><Globe className="size-4 mr-2"/> Discovery</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
                <form onSubmit={handleSave}>
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

                <Separator className="my-4"/>

                <div className="space-y-2">
                    <h3 className="font-semibold text-destructive">Danger Zone</h3>
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
            <TabsContent value="discovery">
                 <form onSubmit={handleSave}>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
