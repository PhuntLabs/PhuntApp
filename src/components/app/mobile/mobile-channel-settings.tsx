'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Channel, Server } from '@/lib/types';
import { ChevronLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MobileChannelSettingsProps {
  trigger: React.ReactNode;
  channel: Channel;
  server: Server;
  onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
  onClose?: () => void;
}

export function MobileChannelSettings({ trigger, channel, server, onUpdateChannel, onClose }: MobileChannelSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [channelName, setChannelName] = useState(channel.name);
  const [channelTopic, setChannelTopic] = useState(channel.topic || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
      if(isOpen) {
          setChannelName(channel.name);
          setChannelTopic(channel.topic || '');
      }
  }, [isOpen, channel]);

  const handleSave = async () => {
    if (!channelName.trim()) {
      toast({ variant: 'destructive', title: 'Channel name cannot be empty.' });
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateChannel(channel.id, {
        name: channelName,
        topic: channelTopic,
      });
      toast({ title: 'Channel updated!' });
      setIsOpen(false);
      onClose?.();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <ChevronLeft />
            </Button>
            <SheetTitle>Edit Channel</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
              <Save />
            </Button>
          </SheetHeader>
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="mobile-channel-name">Channel Name</Label>
              <Input
                id="mobile-channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-channel-topic">Channel Topic</Label>
              <Textarea
                id="mobile-channel-topic"
                value={channelTopic}
                onChange={(e) => setChannelTopic(e.target.value)}
                placeholder="Let everyone know what this channel is about"
              />
            </div>
             {/* TODO: Add permissions editing for mobile */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
