import { Timestamp } from '@firebase/firestore-types';


export class Instructor {
  $key ? : string;
  createdOn?:  any | Timestamp;
  updatedOn?:  any | Timestamp;
  name: string;
  last_name: string;
  email: string;
  src: string;
  class_type: string;
  class_count: number;
  phone: string;
  birthday: Date | Timestamp | any;
  schedule: string;
  not_working: string;
  emergency_contact?: string;
  emergency_phone?: string;
  health: string;
  description: string;
  phrase?: string
  trayectory?: string;
  more?: string
  backgroundsrc?: string;
  images?: string[];
  assistence: number;
  occupancy: number;
  total_spots: number;
}
