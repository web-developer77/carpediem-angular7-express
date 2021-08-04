import { Injectable, HostListener } from "@angular/core";
import { AngularFirestore} from '@angular/fire/firestore';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SubClass } from '../models/sub_class';
import { Booking } from '../models/bookings';
import { BookProcess } from '../models/bookProcess';
import { Class } from '../models/class';
import { SubClassService } from './sub_class.service';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import { NGXLogger } from 'ngx-logger';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  public bookProcess: BookProcess = new BookProcess();
  timeOut: any;

  constructor(
    private db: AngularFirestore,
    private logger: NGXLogger
    ) {
      moment.locale('es');
      this.bookProcess.index = 0;
      this.bookProcess.new = true;
      this.bookProcess.sub_class = new SubClass();
      this.bookProcess.booked = false;
      this.bookProcess.sub_init = true;
    }

  // function to set the book state from component
  setBook(bookProcess: BookProcess): void{
    this.bookProcess = bookProcess;
  }

  // function to get book state from component
  getBook(): BookProcess {
    return this.bookProcess;
  }

  //function to delete booking after 6 minutes
  setTimer(){
    this.timeOut = setTimeout(() => {
      this.deleteBook();
    }, 360000);
  }

  //function to cancel timeout in book was completed
  cancelTimeout(){
    if (this.timeOut) clearTimeout(this.timeOut);
  }

  //function to delete booking if timeout or exit page 
  deleteBook(): void {
    if (this.timeOut) clearTimeout(this.timeOut);
    // if it was not booked delete info
    if (!this.bookProcess.booked) {
      // we log it
      if (this.bookProcess.booking_id){
        this.logger.info(`Service-Reservacion-NoTerminada-Service, usuario ${this.bookProcess.user}, bici ${this.bookProcess.bike}, clase ${this.bookProcess.sub_class}, book ${this.bookProcess.booking_id}`);
      }
      // we res init the book process variables
      this.bookProcess.index = 0;
      this.bookProcess.sub_class = new SubClass();
      this.bookProcess.sub_init = false;
      this.bookProcess.bike = -1;
      this.bookProcess.booking_id = "";
      this.bookProcess.week_start = moment().format('LL');
      this.bookProcess.week_end = moment().add(6, 'days').format('LL');
      this.bookProcess.date_start = moment().subtract(1, 'days');
    }
  }

  // function to restart book Process, when we create a new bookPorcess Object, the service and component objects are no longer in sync;
  // in book component on init we get the object once again to start a new process
  resetBook(){
    this.bookProcess = new BookProcess();
    this.bookProcess.index = 0;
    this.bookProcess.sub_class = new SubClass();
    this.bookProcess.booked = false;
    this.bookProcess.sub_init = false;
  }

  // get bookings without key
  getBookings() {
    return this.db.collection('booking');
  }

  // get bookings with key
  getBookingsInfo(): Observable<Booking[]> {
    return this.db.collection('booking').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  // create a new booking and check that it is not duplicated
  createBooking(data: Booking) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return new Promise((resolve) => {
      this.db.collection('booking', ref => ref.where('date', '==', data.date).where('spot', '==', data.spot).where('sub_class', '==' , data.sub_class))
      .snapshotChanges().pipe(take(1)).subscribe(d => {
        const duplicatedBooking = d.map(c => c.payload.doc.data() as Booking)
        if (duplicatedBooking.length > 0 && (duplicatedBooking[0].status == 'assisted' || duplicatedBooking[0].status == 'confirmed')) {
          return resolve('bookingduplicated')
        }
        else return resolve(this.db.collection('booking').add({ ...data }));
      })
    })
  }

  getBookingBySpot(sub:string, spot:number, user: string){
    return this.db.collection('booking', ref => ref.where('user', '==', user).where('spot', '==', spot).where('sub_class', '==' , sub)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      }));
  }

  getBookingById(id: string): Observable<Booking>{
    return this.db.collection('booking').doc(id).snapshotChanges().pipe(
      map(data => {
        return data.payload.data() as Booking;
      })
    );
  }

  deleteBooking(id: string) {
    return this.db.doc('booking/' + id).delete();
  }

  updateBooking(data: Booking) {
    data.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('booking').doc(data.$key).update({... data});
  }

  // get the booking that belong to a user
  getBookingByUser(user: string) {
    return this.db.collection('booking', ref => ref.where('user', '==', user)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      }));
  }

  // get the booking that belong to a user
  getConfirmedBookingsByUser(user: string) {
    return this.db.collection('booking', ref => ref.where('user', '==', user)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
            return { $key, ...data };
        }).filter(book => book.status == 'confirmed' || book.status == 'assisted');
      }));
  }

  // get the bookings that belong to a class
  getBookingBySubClass(sub: string) {
    return this.db.collection('booking', ref => ref.where('sub_class', '==', sub)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      }));
  }

  // get only confirmed or assited bookings to filter canceled and incompleted ones
  getConfirmedBookings(sub: string) {
    return this.db.collection('booking', ref => ref.where('sub_class', '==', sub)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
            return { $key, ...data };
        }).filter(book => book.status == 'confirmed' || book.status == 'assisted');
      }));
  }

  // get bookings by a date
  getBookingByDate(date: string){
    return this.db.collection('booking', ref => ref.where('date', '==', date )).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  // functoon to double check if booking is still available
  checkAvailable(user: string, spot: number, sub_class: string ): Promise <boolean> {
    return new Promise((resolve) => {
      this.db.collection('booking', ref => ref.where('spot', '==', spot).where('sub_class', '==' , sub_class))
      .snapshotChanges().pipe(take(1)).subscribe(bookings => {
        if (bookings.length > 0){
          bookings.forEach((book: any) =>{
            if(book.payload.doc.data().user !== user ){
              return resolve(false);
            }
          });
          return resolve(true);
        } else {
          return resolve(true);
        }
      })
    })
  }

  updateBookingUser(booking: Booking, user: User){
      //--create batch-- 
      var batch = this.db.firestore.batch();

      booking.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
      const bookingRef = this.db.collection('booking').doc(booking.$key).ref;
      batch.update(bookingRef , {... booking});

      const userRef = this.db.collection('users').doc(user.$key).ref;
      batch.update(userRef , {... user});

      return batch.commit();
  }

   // get bookings by a date
   getBookingByDateRange(start: Date, end: Date){
    return this.db.collection('booking', ref => ref.where('dateObj', '>', start ).where('dateObj', '<', end)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Booking;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }
}
