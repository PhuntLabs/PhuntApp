import { FieldValue, Timestamp } from "firebase/firestore";
import { z } from 'zod';

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export const ALL_BADGES = ['developer', 'beta tester', 'youtuber', 'tiktoker', 'goat'] as const;
export const BadgeType = z.enum(ALL_BADGES);
export type BadgeType = z.infer<typeof BadgeType>;

export interface UserProfile {
  id: string;
  uid: string;
  email?: string | null;
  displayName: string;
  displayName_lowercase?: string;
  photoURL: string | null;
  bannerURL?: string | null;
  bio?: string;
  isBot?: boolean;
  createdAt?: FieldValue;
  badges?: BadgeType[];
  status?: UserStatus;
}

export interface ChatDocument {
  id: string;
  members: string[];
  isOfficial?: boolean;
  name?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  lastMessageTimestamp?: Timestamp;
}

export interface PopulatedChat extends Omit<ChatDocument, 'members'> {
  members: Partial<UserProfile>[];
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: FieldValue;
  edited?: boolean;
  mentions?: string[];
  imageUrl?: string;
}

export interface FriendRequest {
    id: string;
    from: {
        id: string;
        displayName: string;
    },
    to: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp;
}

export interface CustomEmoji {
    name: string;
    url: string;
}

export interface Role {
    id: string;
    name: string;
    color: string;
    priority: number; // Lower number = higher priority
}

export interface Server {
    id:string;
    name: string;
    ownerId: string;
    members: string[];
    memberDetails: { [userId: string]: { joinedAt: FieldValue, roles: string[] } };
    photoURL?: string | null;
    createdAt: FieldValue;
    channels?: Channel[];
    isPublic?: boolean;
    description?: string;
    customEmojis?: CustomEmoji[];
    roles?: Role[];
    customInviteLink?: string;
}

export type ChannelType = 'text' | 'announcement' | 'rules' | 'forum';

export interface Channel {
    id: string;
    name: string;
    serverId: string;
    createdAt?: FieldValue;
    position: number;
    type: ChannelType;
}

export interface Emoji {
    name: string;
    char: string;
    keywords: string[];
}
