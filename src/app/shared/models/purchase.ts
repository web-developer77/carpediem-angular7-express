import { Timestamp } from '@firebase/firestore-types';

export class Purchase{
    $key?: string;
    createdOn?: any | Timestamp;
    updatedOn?: any | Timestamp;
    subscription: boolean;
    user: string;
    amount: number;
    package: string;
    subscription_count?: number;
    date: string;
    expiration:  Date | any;
    expirationObj:  Date | any;
    card: string;
  }