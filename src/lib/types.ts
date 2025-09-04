
import { FieldValue, Timestamp } from "firebase/firestore";

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
  badges?: string[];
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

export interface Server {
    id:string;
    name: string;
    ownerId: string;
    members: string[];
    photoURL?: string | null;
    createdAt: FieldValue;
    channels?: Channel[];
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
