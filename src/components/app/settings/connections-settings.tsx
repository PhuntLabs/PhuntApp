
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Link, X } from 'lucide-react';
import type { Connection } from '@/lib/types';
import { serverTimestamp } from 'firebase/firestore';

const supportedConnections = [
  {
    id: 'spotify',
    name: 'Spotify',
    logo: '/spotify-logo.svg',
    description: 'Show what you\'re listening to as your status.'
  }
];

export function ConnectionsSettings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.connections) {
      setConnections(user.connections);
    }
  }, [user]);

  const handleConnect = async (type: 'spotify') => {
    // In a real application, this would initiate the OAuth flow.
    // For this prototype, we'll simulate a successful connection.
    setIsUpdating(true);
    try {
      const newConnection: Connection = {
        type,
        username: user?.displayName || 'user', // Use a placeholder
        connectedAt: serverTimestamp(),
      };
      
      const updatedConnections = [...connections, newConnection];
      await updateUserProfile({ connections: updatedConnections });
      setConnections(updatedConnections);

      toast({
        title: 'Connection Successful',
        description: `Your ${type} account has been linked.`,
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Connection Failed', description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDisconnect = async (type: 'spotify') => {
    setIsUpdating(true);
     try {
      const updatedConnections = connections.filter(c => c.type !== type);
      await updateUserProfile({ connections: updatedConnections });
      setConnections(updatedConnections);

      toast({
        title: 'Disconnected',
        description: `Your ${type} account has been unlinked.`,
      });
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

                return (
                    <div key={connInfo.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Image src={connInfo.logo} alt={`${connInfo.name} logo`} width={40} height={40} />
                            <div>
                                <p className="font-semibold">{connInfo.name}</p>
                                <p className="text-sm text-muted-foreground">{connInfo.description}</p>
                            </div>
                        </div>
                        {existingConnection ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{existingConnection.username}</span>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDisconnect(connInfo.id as 'spotify')} disabled={isUpdating}>
                                    <X className="size-5" />
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => handleConnect(connInfo.id as 'spotify')} disabled={isUpdating}>
                                <Link className="mr-2" /> Connect
                            </Button>
                        )}
                    </div>
                )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
