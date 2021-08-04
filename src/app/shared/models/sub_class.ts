import { Timestamp } from '@firebase/firestore-types';
import { instructor } from './class';
import { User } from './user';

interface user_bike {
  [x: string]: any;
  user: string;
  bike: number;
  extras: extras[];
  confirmed?: boolean;
}

interface extras{
    name: string;
    ammount: number;
}

export class SubClass {
    $key?: string;
    createdOn?: any | Timestamp;
    updatedOn?: any | Timestamp;
    class: string;
    date: Date | Timestamp | any;
    dateObj: Date | any;
    users?: user_bike[];
    color: string;
    start: string;
    end: string;
    instructor: instructor;
    type: string;
    limit_number?: number;
    note?: string;
    canceled?: boolean
    description?: string;
    users_info?: User[] | any[];
    users_count?: number;
    confirmed_users? : number;
    canceled_users? : number;
    selected_users? : number;
    assisted_users? : number;
}