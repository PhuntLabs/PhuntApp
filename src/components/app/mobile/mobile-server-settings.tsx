
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Server, UserProfile, Role, Permission } from '@/lib/types';
import { ChevronLeft, Save, Trash, Plus, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditServerDialog } from '../edit-server-dialog'; // Keep for desktop logic reference
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';


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
  const { toast } = useToast();
  const { updateUserRolesInServer } = useAuth();
  
  // State for various settings
  const [serverName, setServerName] = useState(server.name);
  const [serverIcon, setServerIcon] = useState(server.photoURL || '');
  const [roles, setRoles] = useState<Role[]>(server.roles || []);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setServerName(server.name);
      setServerIcon(server.photoURL || '');
      setRoles(server.roles || []);
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
        roles: roles,
      });
      toast({ title: 'Server updated!' });
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

  const handleMemberRoleChange = async (memberId: string, roleId: string, isChecked: boolean) => {
      const memberDetails = server.memberDetails[memberId];
      if (!memberDetails) return;

      const currentRoles = memberDetails.roles || [];
      const newRoles = isChecked
          ? [...currentRoles, roleId]
          : currentRoles.filter(id => id !== roleId);
      
      try {
          await updateUserRolesInServer(server.id, memberId, newRoles);
          toast({ title: 'Roles updated'});
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update roles.' });
      }
  };

  const filteredMembers = members.filter(member => 
      member.displayName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full p-0 flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <ChevronLeft />
            </Button>
            <SheetTitle>Server Settings</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
              <Save />
            </Button>
          </SheetHeader>
          
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
             <TabsList className="grid w-full grid-cols-4 mx-auto px-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="danger">Danger</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                <TabsContent value="overview">
                    <div className="space-y-4">
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
                    </div>
                </TabsContent>
                <TabsContent value="roles">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Manage Roles</h3>
                            <Button size="sm"><Plus className="mr-2 size-4"/> Add Role</Button>
                        </div>
                        {roles.map(role => (
                            <div key={role.id} className="p-2 border rounded-md" style={{borderColor: role.color}}>
                                <p style={{color: role.color}}>{role.name}</p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                 <TabsContent value="members">
                    <div className="space-y-4">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search members..." 
                                className="pl-10 mb-2"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            {filteredMembers.map(member => (
                                <div key={member.uid} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent">
                                    <Avatar className="size-9">
                                        <AvatarImage src={member.photoURL || undefined} />
                                        <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{member.displayName}</p>
                                    </div>
                                    {/* Role management for mobile would go here */}
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="danger">
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
                </TabsContent>
                </div>
            </ScrollArea>
          </Tabs>
      </SheetContent>
    </Sheet>
  );
}
