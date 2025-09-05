
'use client';

import React from 'react';
import { ExternalLinkDialog } from './external-link-dialog';
import { ServerInviteEmbed } from './server-invite-embed';
import type { CustomEmoji } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  content: string;
  customEmojis?: CustomEmoji[];
  imageUrl?: string;
}

const combinedRegex = /(https?:\/\/[^\s]+)|(@\w+)|(:[a-zA-Z0-9_+-]+:)/g;

const inviteRegex = /\/join\/([a-zA-Z0-9]+)/;
const mentionRegex = /@(\w+)/;
const emojiRegex = /:([a-zA-Z0-9_+-]+):/;

export function MessageRenderer({ content, customEmojis = [], imageUrl }: MessageRendererProps) {
  if (!content && !imageUrl) return null;

  const parts = content ? content.split(combinedRegex) : [''];

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        const emojiMatch = part.match(emojiRegex);
        if (emojiMatch) {
            const emojiName = emojiMatch[1];
            const customEmoji = customEmojis.find(e => e.name === emojiName);
            if (customEmoji) {
                return (
                    <Image 
                        key={i}
                        src={customEmoji.url} 
                        alt={customEmoji.name}
                        width={24}
                        height={24}
                        className="inline-block align-middle mx-0.5"
                    />
                );
            }
        }

        const inviteMatch = part.match(inviteRegex);
        if (inviteMatch && inviteMatch[1]) {
          const serverId = inviteMatch[1];
          return <ServerInviteEmbed key={i} serverId={serverId} />;
        }

        const mentionMatch = part.match(mentionRegex);
        if (mentionMatch) {
          const isEveryone = mentionMatch[1] === 'everyone' || mentionMatch[1] === 'here';
          return <strong key={i} className={cn(
            "font-medium px-1 rounded-sm",
            isEveryone ? "text-amber-400 bg-amber-500/20" : "text-indigo-400 bg-indigo-500/20"
            )}>{part}</strong>
        }
        
        if (part.startsWith('http')) {
             return (
                <ExternalLinkDialog key={i} url={part}>
                <a
                    className="text-blue-400 hover:underline"
                    onClick={(e) => e.preventDefault()}
                >
                    {part}
                </a>
                </ExternalLinkDialog>
            );
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block max-w-xs">
          <Image
            src={imageUrl}
            alt="User uploaded image"
            width={400}
            height={300}
            className="rounded-lg object-contain"
          />
        </a>
      )}
    </>
  );
}
