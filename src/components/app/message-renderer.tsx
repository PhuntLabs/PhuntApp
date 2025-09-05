
'use client';

import React from 'react';
import { ExternalLinkDialog } from './external-link-dialog';
import { ServerInviteEmbed } from './server-invite-embed';
import type { CustomEmoji } from '@/lib/types';
import Image from 'next/image';

interface MessageRendererProps {
  content: string;
  customEmojis?: CustomEmoji[];
}

const combinedRegex = /(https?:\/\/[^\s]+)|(@\w+)|(:[a-zA-Z0-9_+-]+:)/g;

const inviteRegex = /\/join\/([a-zA-Z0-9]+)/;
const mentionRegex = /@(\w+)/;
const emojiRegex = /:([a-zA-Z0-9_+-]+):/;

export function MessageRenderer({ content, customEmojis = [] }: MessageRendererProps) {
  if (!content) return null;

  const parts = content.split(combinedRegex);

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

        if (part.match(mentionRegex)) {
          return <strong key={i} className="text-indigo-400 font-medium bg-indigo-500/20 px-1 rounded-sm">{part}</strong>
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
    </>
  );
}
