import { Timestamp } from '@firebase/firestore-types';

export interface instructor {
  $key: string;
  name: string;
  src: string;
}

export class Class {
    $key: string;
    createdOn?: any | Timestamp;
    updatedOn?: any | Timestamp;
    user: string;
    type: string;
    instructor: instructor;
    studio: string;
    date: Date | Timestamp | any;
    repeat: string;
    alert: string;
    color: string;
    start: string;
    end: string;
    reservations: boolean;
    limit: boolean;
    days: number[];
    weeks: string;
    limitNumber: number;
    description: string;
    note: string;
    sub_class: string[];
    cancelations:  any[];
  }

