import { Class} from './class';
import { SubClass } from './sub_class';
import { Booking } from './bookings';
interface extras{
    name: string;
    ammount: number;
}


export class BookProcess {
    clase: Class;
    sub_class: SubClass;
    bookings: Booking[];
    user: boolean;
    bike: number;
    index: number;
    date: Date;
    new: boolean;
    booked: boolean;
    sub_init: boolean;
    booking_id: string;
    extras: extras [];
    week_start: string;
    week_end: string; 
    date_start: any;
}
