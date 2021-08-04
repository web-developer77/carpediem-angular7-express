import { Timestamp } from '@firebase/firestore-types';

export class Discount {
    $key?: string;
    createdOn?:  any | Timestamp;
    updatedOn?:  any | Timestamp;
    code: string;
    percentage: number;
}