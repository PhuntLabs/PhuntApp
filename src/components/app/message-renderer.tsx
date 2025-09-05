'use client';

import React from 'react';
import { ExternalLinkDialog } from './external-link-dialog';
import { ServerInviteEmbed } from './server-invite-embed';

interface MessageRendererProps {
  content: string;
}

// Regex to find URLs in text
const urlRegex = /(https?:\/\/[^\s]+)/g;

// Regex to specifically find invite links
const inviteRegex = /\/join\/([a-zA-Z0-9]+)/;

export function MessageRenderer({ content }: MessageRendererProps) {
  if (!content) return null;

  const parts = content.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          const inviteMatch = part.match(inviteRegex);
          if (inviteMatch && inviteMatch[1]) {
            const serverId = inviteMatch[1];
            return <ServerInviteEmbed key={i} serverId={serverId} />;
          } else {
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
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
