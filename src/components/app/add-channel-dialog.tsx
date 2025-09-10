
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChannelType } from '@/lib/types';
import { Hash, Megaphone, ScrollText, MessageSquare, Mic, Shield } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';


interface AddChannelDialogProps {
  children: React.ReactNode;
  onCreateChannel: (name: string, type: ChannelType) => Promise<void>;
}

const channelTypes: { value: ChannelType; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Text', description: 'Send messages, images, emoji, and opinions.', icon: Hash },
  { value: 'announcement', label: 'Announcement', description: 'Important updates for people in and out of the server.', icon: Megaphone },
  { value: 'rules', label: 'Rules', description: 'A dedicated space for your server\'s rules.', icon: ScrollText },
  { value: 'forum', label: 'Forum', description: 'Create a space for organized discussions.', icon: MessageSquare },
];


export function AddChannelDialog({ children, onCreateChannel }: AddChannelDialogProps) {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>('text');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      setIsLoading(true);
      try {
        await onCreateChannel(channelName.trim(), channelType);
        setChannelName('');
        setChannelType('text');
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to create channel", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleTypeChange = (value: ChannelType) => {
    setChannelType(value);
    if (!channelName) {
        setChannelName(`${value}-channel`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Channel</DialogTitle>
          <DialogDescription>
            in Text Channels
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
                <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Channel Type</Label>
                     <RadioGroup value={channelType} onValueChange={(v) => handleTypeChange(v as ChannelType)} className="mt-2 space-y-2">
                        {channelTypes.map((type) => (
                          <Label
                            key={type.value}
                            htmlFor={`type-${type.value}`}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                              channelType === type.value ? "border-primary bg-primary/10" : "border-transparent bg-muted hover:bg-muted/80"
                            )}
                          >
                            <type.icon className="size-8 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-semibold">{type.label}</p>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                            <RadioGroupItem value={type.value} id={`type-${type.value}`} />
                          </Label>
                        ))}
                    </RadioGroup>
                </div>
                 <div>
                    <Label htmlFor="channel-name" className="text-xs font-bold uppercase text-muted-foreground">Channel Name</Label>
                    <div className="relative mt-2">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <Input
                          id="channel-name"
                          value={channelName}
                          onChange={(e) => setChannelName(e.target.value)}
                          className="pl-10"
                          placeholder="new-channel"
                          required
                        />
                    </div>
                 </div>
                 <div>
                    <div className="flex items-center justify-between">
                         <Label htmlFor="private-channel" className="flex items-center gap-2 font-semibold">
                            <Shield className="size-4" />
                            Private Channel
                        </Label>
                        <Switch id="private-channel" disabled />
                    </div>
                     <p className="text-xs text-muted-foreground mt-1">Only selected members and roles will be able to view this channel.</p>
                 </div>

            </div>
          <DialogFooter className="bg-secondary -m-6 mt-6 p-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !channelName.trim()}>
              {isLoading ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
