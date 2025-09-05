
import { FieldValue, Timestamp } from "firebase/firestore";
import { z } from 'zod';

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export const ALL_BADGES = ['developer', 'bot', 'beta tester', 'youtuber', 'tiktoker', 'goat', 'early supporter'] as const;
export const BadgeType = z.enum(ALL_BADGES);
export type BadgeType = z.infer<typeof BadgeType>;

export type AvatarEffect = 'none' | 'rage' | 'glow' | 'orbit' | 'sparkle' | 'bounce';
export type ProfileEffect = 'none' | 'rain' | 'snow' | 'aurora' | 'starfield' | 'confetti';

export interface Game {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  embedUrl: string;
}

export interface CustomGame {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
}

export interface Connection {
    type: 'spotify' | 'github' | 'steam' | 'youtube'; // Add more as needed
    username: string;
    connectedAt: FieldValue | Date;
}

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
  isDiscoverable?: boolean;
  isVerified?: boolean;
  createdAt?: FieldValue;
  badges?: BadgeType[];
  status?: UserStatus;
  customStatus?: string;
  avatarEffect?: AvatarEffect;
  profileEffect?: ProfileEffect;
  currentGame?: Game | CustomGame | null; // Can be a standard game or a custom one
  customGames?: CustomGame[];
  connections?: Connection[];
}

export interface ChatDocument {
  id: string;
  members: string[];
  typing?: { [userId: string]: true };
  isOfficial?: boolean;
  name?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  lastMessageTimestamp?: Timestamp;
  unreadCount?: { [userId: string]: number };
}

export interface PopulatedChat extends Omit<ChatDocument, 'members'> {
  members: Partial<UserProfile>[];
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface Embed {
    title?: string;
    description?: string;
    color?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    thumbnail?: string;
    image?: string;
    author?: { name: string; url?: string; icon_url?: string };
    footer?: { text: string; icon_url?: string };
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: FieldValue;
  edited?: boolean;
  reactions?: Reaction[];
  mentions?: string[];
  imageUrl?: string;
  embed?: Embed;
  replyTo?: {
    messageId: string;
    senderId: string;
    senderDisplayName: string;
    text: string;
  };
}

export interface Mention {
    id: string;
    mentionedUserId: string;
    sender: string;
    text: string;
    timestamp: FieldValue;
    context: {
        type: 'dm';
        chatId: string;
        chatName: string;
    } | {
        type: 'channel';
        serverId: string;
        serverName: string;
        channelId: string;
        channelName: string;
    }
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

export const permissionFlags = [
    'administrator',
    'manageServer',
    'manageChannels',
    'manageRoles',
    'kickMembers',
    'banMembers',
    'mentionEveryone',
    'viewChannels',
    'sendMessages',
] as const;

export type Permission = (typeof permissionFlags)[number];

export interface Role {
    id: string;
    name: string;
    color: string;
    priority: number; // Lower number = higher priority
    permissions: Partial<Record<Permission, boolean>>;
}

export interface ServerProfile {
    nickname: string;
    avatar: string;
}

export interface Server {
    id:string;
    name: string;
    ownerId: string;
    members: string[];
    memberDetails: { [userId: string]: { joinedAt: FieldValue, roles: string[], profile?: ServerProfile } };
    photoURL?: string | null;
    bannerURL?: string | null;
    createdAt: FieldValue;
    channels: Channel[];
    isPublic?: boolean;
    description?: string;

    customEmojis?: CustomEmoji[];
    roles?: Role[];
    customInviteLink?: string;
    isVerified?: boolean;
    systemChannelId?: string;
}

export type ChannelType = 'text' | 'announcement' | 'rules' | 'forum';

export interface Channel {
    id: string;
    name: string;
    topic?: string;
    serverId: string;
    createdAt?: FieldValue;
    type: ChannelType;
    typing?: { [userId: string]: true };
    permissionOverwrites?: {
        [roleId: string]: Partial<Record<Permission, boolean>>;
    };
}

export interface Category {
    id: string;
    name: string;
    position: number;
    channels: Channel[];
}


export interface Emoji {
    name: string;
    char: string;
    keywords: string[];
}
