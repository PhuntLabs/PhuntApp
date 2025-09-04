import { FieldValue, Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string | null;
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
  members: UserProfile[];
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: FieldValue;
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
