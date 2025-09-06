'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Server, UserProfile } from '@/lib/types';
import { ChevronLeft, Save, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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

interface MobileServerSettingsProps {
  trigger: React.ReactNode;
  server: Server;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
  members: Partial<UserProfile>[];
  onClose?: () => void;
}

export function MobileServerSettings({ trigger, server, onUpdateServer, onDeleteServer, members, onClose }: MobileServerSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverName, setServerName] = useState(server.name);
  const [serverIcon, setServerIcon] = useState(server.photoURL || '');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
    }
  }, [isOpen, server]);

  const handleSave = async () => {
    if (!serverName.trim()) {
      toast({ variant: 'destructive', title: 'Server name cannot be empty.' });
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateServer(server.id, {
        name: serverName,
        photoURL: serverIcon,
      });
      toast({ title: 'Server updated!' });
      setIsOpen(false);
      onClose?.();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
        await onDeleteServer(server.id);
        setIsOpen(false);
        onClose?.();
        toast({ title: "Server Deleted" });
    } catch(e:any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <ChevronLeft />
            </Button>
            <SheetTitle>Server Settings</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
              <Save />
            </Button>
          </SheetHeader>
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="mobile-server-name">Server Name</Label>
              <Input
                id="mobile-server-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-server-icon">Icon URL</Label>
              <Input
                id="mobile-server-icon"
                value={serverIcon}
                onChange={(e) => setServerIcon(e.target.value)}
                placeholder="https://image.url/icon.png"
              />
            </div>
             {/* TODO: Add other settings like roles, members for mobile */}

             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <Trash className="mr-2" /> Delete Server
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
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
