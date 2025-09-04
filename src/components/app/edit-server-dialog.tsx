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
import { Trash } from 'lucide-react';
import { Separator } from '../ui/separator';

interface EditServerDialogProps {
  children: React.ReactNode;
  server: Server;
  onUpdateServer: (serverId: string, name: string, photoURL: string) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
}

export function EditServerDialog({ children, server, onUpdateServer, onDeleteServer }: EditServerDialogProps) {
  const [serverName, setServerName] = useState(server.name);
  const [serverIcon, setServerIcon] = useState(server.photoURL || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (server) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
    }
  }, [server]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serverName.trim()) {
      setIsSaving(true);
      try {
        await onUpdateServer(server.id, serverName.trim(), serverIcon.trim());
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Server Settings</DialogTitle>
          <DialogDescription>
            Manage settings for your server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="server-name" className="text-right">
                Server Name
              </Label>
              <Input
                id="server-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="server-icon" className="text-right">
                Icon URL
              </Label>
              <Input
                id="server-icon"
                value={serverIcon}
                onChange={(e) => setServerIcon(e.target.value)}
                className="col-span-3"
                placeholder="https://image.url/icon.png"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>

        <Separator className="my-2"/>

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
      </DialogContent>
    </Dialog>
  );
}
