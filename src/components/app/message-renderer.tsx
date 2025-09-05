
'use client';

import React from 'react';
import { ExternalLinkDialog } from './external-link-dialog';
import { ServerInviteEmbed } from './server-invite-embed';
import type { CustomEmoji, Message, Reaction } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { SmilePlus } from 'lucide-react';
import { toggleReaction } from '@/ai/flows/reaction-flow';
import { useAuth } from '@/hooks/use-auth';

interface MessageRendererProps {
  content: string;
  customEmojis?: CustomEmoji[];
  imageUrl?: string;
  reactions?: Reaction[];
  messageId?: string;
  messageContext?: { type: 'dm', chatId: string } | { type: 'channel', serverId: string, channelId: string };
}

const combinedRegex = /(https?:\/\/[^\s]+)|(@\w+)|(:[a-zA-Z0-9_+-]+:)|(😀|😂|😭|🤔|👍|❤️|🔥|🚀)/g;

const inviteRegex = /\/join\/([a-zA-Z0-9]+)/;
const mentionRegex = /@(\w+)/;
const emojiRegex = /:([a-zA-Z0-9_+-]+):/;
const standardEmojiRegex = /(😀|😂|😭|🤔|👍|❤️|🔥|🚀)/;

export function MessageRenderer({ content, customEmojis = [], imageUrl, reactions, messageId, messageContext }: MessageRendererProps) {
  const { authUser } = useAuth();
  
  if (!content && !imageUrl) return null;

  const parts = content ? content.split(combinedRegex) : [''];
  
  const handleReactionClick = (emoji: string) => {
    if (!authUser || !messageId || !messageContext) return;
    toggleReaction({
      userId: authUser.uid,
      messageId,
      emoji,
      context: messageContext
    });
  }

  return (
    <div className="flex flex-col">
      <div className="text-sm text-foreground/90">
        {parts.map((part, i) => {
          if (!part) return null;

          const customEmojiMatch = part.match(emojiRegex);
          if (customEmojiMatch) {
              const emojiName = customEmojiMatch[1];
              const customEmoji = customEmojis?.find(e => e.name === emojiName);
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

          const standardEmojiMatch = part.match(standardEmojiRegex);
          if (standardEmojiMatch) {
              return <span key={i} className="text-xl align-middle">{part}</span>
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
      </div>

       {(reactions && reactions.length > 0) && (
        <div className="flex items-center gap-1 pt-1.5 flex-wrap">
          {reactions.map(({ emoji, users }) => {
            const isCustom = emoji.startsWith("https://");
            const hasReacted = authUser && users.includes(authUser.uid);
            return (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={cn(
                    "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full transition-colors",
                    hasReacted ? "bg-primary/20 border border-primary/50" : "bg-accent hover:bg-accent/80 border border-transparent"
                )}
              >
                {isCustom ? (
                    <Image src={emoji} alt="custom emoji" width={16} height={16}/>
                ) : (
                    <span className="text-sm">{emoji}</span>
                )}
                <span className="text-xs font-semibold">{users.length}</span>
              </button>
            )
           })}
        </div>
      )}

    </div>
  );
}
