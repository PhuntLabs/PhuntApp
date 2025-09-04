
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Channel, ChannelType } from '@/lib/types';
import { Hash, Megaphone, ScrollText, MessageSquare } from 'lucide-react';

interface EditChannelDialogProps {
  children: React.ReactNode;
  channel: Channel;
  onUpdateChannel: (channelId: string, data: { name?: string, type?: ChannelType }) => Promise<void>;
}

const channelTypes: { value: ChannelType; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Text Channel', icon: Hash },
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'rules', label: 'Rules', icon: ScrollText },
  { value: 'forum', label: 'Forum', icon: MessageSquare },
];

export function EditChannelDialog({ children, channel, onUpdateChannel }: EditChannelDialogProps) {
  const [channelName, setChannelName] = useState(channel.name);
  const [channelType, setChannelType] = useState(channel.type || 'text');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (channel) {
      setChannelName(channel.name);
      setChannelType(channel.type || 'text');
    }
  }, [channel, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      setIsLoading(true);
      try {
        await onUpdateChannel(channel.id, { name: channelName.trim(), type: channelType });
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to update channel", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Channel Type</Label>
              <Select value={channelType} onValueChange={(value) => setChannelType(value as ChannelType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel type" />
                </SelectTrigger>
                <SelectContent>
                  {channelTypes.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !channelName.trim()}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
