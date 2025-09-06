
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bell, Loader2 } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Helper function to convert urlB64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


export function NotificationsSettings() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the browser supports notifications and service workers
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsLoading(false);
        return;
    }
    
    // Check current subscription state
    navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
            if (sub) {
                setIsSubscribed(true);
                setSubscription(sub);
            }
            setIsLoading(false);
        });
    });
  }, []);

  const handleSubscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'VAPID public key is not configured. Cannot subscribe to notifications.'
        });
        return;
    }
    
    setIsLoading(true);
    
    if (!('serviceWorker' in navigator)) {
        toast({ variant: 'destructive', title: 'Unsupported Browser' });
        setIsLoading(false);
        return;
    }
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: 'You must allow notifications to enable this feature.',
            });
            setIsLoading(false);
            return;
        }

        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        
        // In a real app, you would send this subscription object to your backend
        // to save it and use it to send push notifications.
        console.log('Push Subscription:', JSON.stringify(sub));
        
        setSubscription(sub);
        setIsSubscribed(true);
        toast({ title: 'Subscribed!', description: 'You will now receive push notifications.' });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Subscription Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleUnsubscribe = async () => {
    if (!subscription) return;
    
    setIsLoading(true);
    try {
        await subscription.unsubscribe();
        
        // You should also notify your backend to remove the subscription.
        console.log('Unsubscribed successfully.');

        setSubscription(null);
        setIsSubscribed(false);
        toast({ title: 'Unsubscribed', description: 'You will no longer receive push notifications.' });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Unsubscribe Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">
          Manage how you receive notifications from the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Receive notifications even when the app is in the background. Requires a one-time permission.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isSubscribed ? (
                <p className="text-sm text-green-500 font-medium">
                    You are currently subscribed to push notifications.
                </p>
           ) : (
                <p className="text-sm text-muted-foreground">
                    You are not subscribed to push notifications.
                </p>
           )}
        </CardContent>
        <CardFooter>
            <Button onClick={isSubscribed ? handleUnsubscribe : handleSubscribe} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin"/>}
                {isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
