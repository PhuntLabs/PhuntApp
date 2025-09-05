
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Link, X, Loader2 } from 'lucide-react';
import type { Connection } from '@/lib/types';
import { serverTimestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // This effect simulates the callback from the OAuth provider
  useEffect(() => {
    if (searchParams.get('connected') === 'spotify') {
      const type = 'spotify';
      // In a real app, you'd get the username from the callback data
      const newConnection: Connection = {
        type,
        username: user?.displayName || 'user', 
        connectedAt: serverTimestamp(),
      };
      
      const updatedConnections = [...connections, newConnection];
      updateUserProfile({ connections: updatedConnections });
      setConnections(updatedConnections);

      toast({
        title: 'Connection Successful',
        description: `Your ${type} account has been linked.`,
      });
      // Clean up the URL
      router.replace('/?settings=connections');
    }
  }, [searchParams, user, connections, updateUserProfile, router, toast]);

  useEffect(() => {
    if (user?.connections) {
      setConnections(user.connections);
    }
  }, [user]);

  const handleConnect = async (type: 'spotify') => {
    // In a real application, this would redirect to your backend which then redirects to Spotify
    // For this prototype, we'll simulate the redirect flow.
    setIsUpdating(true);
    
    // 1. Construct a realistic-looking Spotify auth URL
    const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || 'dummy_client_id', // Should be in .env.local
        response_type: 'code',
        redirect_uri: `${window.location.origin}/?settings=connections&connected=spotify`, // Simulate redirect back to this page
        scope: 'user-read-currently-playing user-read-playback-state',
        state: 'random_string_for_security'
    });
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    
    // 2. "Redirect" the user
    // In a real app, this would be: window.location.href = authUrl;
    toast({
        title: 'Redirecting to Spotify...',
        description: "Please authorize the application."
    });

    setTimeout(() => {
        router.push(authUrl); // In a real app, this redirect happens for real.
    }, 1500);
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
                                    {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <X className="size-5" />}
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => handleConnect(connInfo.id as 'spotify')} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : <Link className="mr-2" />} Connect
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
