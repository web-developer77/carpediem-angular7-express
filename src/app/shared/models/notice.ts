import { Timestamp } from '@firebase/firestore-types';

export class Notice {
  $key: string;
  createdOn?:  any | Timestamp;
  updatedOn?:  any | Timestamp;
  title: string;
  message: string;
  date: string;
}

