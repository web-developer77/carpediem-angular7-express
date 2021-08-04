import { Timestamp } from '@firebase/firestore-types';

export class Notification {
  $key: string;
  createdOn?:  any | Timestamp;
  updatedOn?:  any | Timestamp;
  user_id: string;
  seen: boolean;
  type: string;
  message: string;
  created: string;
}

