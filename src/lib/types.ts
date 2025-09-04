import { FieldValue } from "firebase/firestore";

export interface DirectMessage {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: FieldValue;
}
