
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Link, X, Loader2, Check } from 'lucide-react';
import type { Connection } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supportedConnections = [
  {
    id: 'github',
    name: 'GitHub',
    logo: '/github-logo.svg',
    description: 'Display your GitHub profile and contributions.',
    type: 'input',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    logo: '/spotify-logo.svg',
    description: 'Show what you\'re listening to as your status.',
    type: 'oauth',
  }
];

export function ConnectionsSettings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');

  useEffect(() => {
    if (user?.connections) {
      setConnections(user.connections);
      const ghConnection = user.connections.find(c => c.type === 'github');
      if (ghConnection) {
        setGithubUsername(ghConnection.username);
      }
    }
  }, [user]);

  const handleConnectGitHub = async () => {
    if (!githubUsername.trim()) {
        toast({ variant: 'destructive', title: 'Username required', description: 'Please enter your GitHub username.' });
        return;
    }
    setIsUpdating(true);
    try {
        const existingConnections = connections.filter(c => c.type !== 'github');
        const newConnection: Connection = {
            type: 'github',
            username: githubUsername.trim(),
            connectedAt: new Date(),
        };

        const updatedConnections = [...existingConnections, newConnection];
        await updateUserProfile({ connections: updatedConnections });
        setConnections(updatedConnections);

        toast({ title: 'GitHub Connected!', description: `Your profile will now show @${newConnection.username}.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to connect', description: error.message });
    } finally {
        setIsUpdating(false);
    }
  };
  
  const handleDisconnect = async (type: 'github' | 'spotify') => {
    setIsUpdating(true);
     try {
      const updatedConnections = connections.filter(c => c.type !== type);
      await updateUserProfile({ connections: updatedConnections });
      setConnections(updatedConnections);

      toast({
        title: 'Disconnected',
        description: `Your ${type} account has been unlinked.`,
      });
      if (type === 'github') {
        setGithubUsername('');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to disconnect', description: error.message });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connections</h2>
        <p className="text-muted-foreground">
          Connect your other accounts to unlock new features and display your activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Connections</CardTitle>
          <CardDescription>
            Manage your linked accounts here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supportedConnections.map(connInfo => {
                const existingConnection = connections.find(c => c.type === connInfo.id);

                if (connInfo.id === 'github') {
                    return (
                         <div key={connInfo.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Image src={connInfo.logo} alt={`${connInfo.name} logo`} width={40} height={40} />
                                    <div>
                                        <p className="font-semibold">{connInfo.name}</p>
                                        <p className="text-sm text-muted-foreground">{connInfo.description}</p>
                                    </div>
                                </div>
                                 {existingConnection && (
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDisconnect('github')} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <X className="size-5" />}
                                    </Button>
                                )}
                            </div>
                            <div className="mt-4 flex items-end gap-2">
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="github-username">GitHub Username</Label>
                                    <Input id="github-username" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="e.g., torvalds" />
                                </div>
                                <Button onClick={handleConnectGitHub} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : existingConnection ? <Check className="mr-2" /> : <Link className="mr-2" />}
                                    {existingConnection ? 'Update' : 'Connect'}
                                </Button>
                            </div>
                         </div>
                    )
                }

                return (
                    <div key={connInfo.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Image src={connInfo.logo} alt={`${connInfo.name} logo`} width={40} height={40} />
                            <div>
                                <p className="font-semibold">{connInfo.name}</p>
                                <p className="text-sm text-muted-foreground">{connInfo.description}</p>
                            </div>
                        </div>
                        <Button onClick={() => toast({ title: 'Coming Soon!', description: 'This integration is not yet available.' })} disabled>
                            Connect
                        </Button>
                    </div>
                )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
