import { instructor } from './class';
import { Timestamp } from '@firebase/firestore-types';


interface extras{
    name: string;
    ammount: number;
}
export class Booking{
    $key?: string;
    createdOn?: any | Timestamp;
    updatedOn?: any | Timestamp;
    status: string;
    sub_class: string;
    user: string;
    name: string;
    instructor: instructor;
    date:  Date | any;
    dateObj: Date | any;
    type: string;
    time: string;
    spot: number;
    extras: extras[];
    free?: boolean;
    fitpass?: boolean;
    lateCancel?: boolean;
}