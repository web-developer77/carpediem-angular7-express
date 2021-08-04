import { Timestamp } from '@firebase/firestore-types';

export class User {
  $key?: string;
  createdOn?:  any | Timestamp;
  updatedOn?:  any | Timestamp;
  uid:string;
  openPay_id: string;
  name:string;
  last_name:string;
  email: string;
  password: string;
  phone: string;
  last_session: Date | any;
  born: Date | any;
  birthday_month: number;
  admin: boolean;
  subscription: boolean;
  subscription_count: number;
  new: boolean;
  assistances: number;
  credits: number;
  fitpass?: boolean;
  expired_credits?: number;
  plan_expiration?:  Date | any;
  plan?: string;
  plan_id?: number;
  open_plan?: string;
  credit_cards: string[];
  shoe_size?: number;
  sex?: string;
  shoe_type?: string;
  health?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  src?: string;
  studio_credits: number;
  studio_expired_credits: number;
  studio_plan_expiration: string;
}

