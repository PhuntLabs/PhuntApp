
'use client';

import React from 'react';
import { ExternalLinkDialog } from './external-link-dialog';
import { ServerInviteEmbed } from './server-invite-embed';

interface MessageRendererProps {
  content: string;
}

// Regex to find URLs or @mentions
const combinedRegex = /(https?:\/\/[^\s]+)|(@\w+)/g;

// Regex to specifically find invite links
const inviteRegex = /\/join\/([a-zA-Z0-9]+)/;
const mentionRegex = /@(\w+)/;

export function MessageRenderer({ content }: MessageRendererProps) {
  if (!content) return null;

  const parts = content.split(combinedRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        if (part.match(combinedRegex)) {
          const inviteMatch = part.match(inviteRegex);
          if (inviteMatch && inviteMatch[1]) {
            const serverId = inviteMatch[1];
            return <ServerInviteEmbed key={i} serverId={serverId} />;
          }

          if (part.match(mentionRegex)) {
            return <strong key={i} className="text-indigo-400 font-medium bg-indigo-500/20 px-1 rounded-sm">{part}</strong>
          }
          
          // It's a non-invite URL
          return (
            <ExternalLinkDialog key={i} url={part}>
              <a
                className="text-blue-400 hover:underline"
                onClick={(e) => e.preventDefault()} // Prevent direct navigation
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
