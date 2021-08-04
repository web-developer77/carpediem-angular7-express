import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user';
import { take } from 'rxjs/operators'
import { ClassesService } from 'src/app/shared/services/classes.service';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { BookingService } from 'src/app/shared/services/booking.service';
import { HttpClient } from '@angular/common/http';
import { Class } from 'src/app/shared/models/class';
import { BookProcess } from 'src/app/shared/models/bookProcess';
import ExtrasJson from '../../../assets/json/extras.json';
import * as moment from 'moment';
import { Booking } from 'src/app/shared/models/bookings.js';
import { Email } from 'src/app/shared/models/email.js';
import { SubClass } from 'src/app/shared/models/sub_class.js';
import { NGXLogger } from 'ngx-logger';
import * as firebase from 'firebase/app';

declare var swal: any;

interface Extras {
  name: string;
  icon: string;
  ammount: number;
  price: number;
}

@Component({
  selector: 'app-add-user-class',
  templateUrl: './add-user-class.component.html',
  styleUrls: ['./add-user-class.component.scss']
})
export class AddUserClassComponent implements OnInit {
  user: User;
  loading = false;
  loadingClasses = true;
  bookProcess: BookProcess = new BookProcess();
  classes: Class[] = [];
  classes_copy: Class[] = [];
  extras: Extras[] = ExtrasJson;
  week: boolean[] = [true, false, false, false];
  week_index = 0;
  week_start: string;
  week_end: string;
  date: any;
  date_filter: any;
  sub: any;
  filter: string;
  special_payment = '';
  show_modal = false;
  classByDay: Array<SubClass[]> = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private subClassService: SubClassService,
    private bookingService: BookingService,
    private http: HttpClient,
    private logger: NGXLogger
  ) {
    this.bookProcess = bookingService.getBook()
    this.userService.getUserByKey(data.id).pipe(take(1)).subscribe(user => {
      this.user = user;
      //variables init
      this.bookProcess.week_start = moment().format('LL');
      this.bookProcess.week_end = moment().add(6, 'days').format('LL');
      this.bookProcess.date_start = moment().subtract(1, 'days');
      this.date_filter = moment();
      const d = new Date();
      d.setDate(d.getDate() - 1);
      // get only future sub clases
      this.subClassService.getSubClassFromDate(d).pipe(take(1)).subscribe(subs => {
        // gruop by date
        for (let i = 0; i < 7; i++) {
          this.classByDay[i] = subs.filter(sub => sub.date === moment().add(i, 'days').format('LL').toString());
        }
        this.loadingClasses = false;
      });
    });
  }

  ngOnInit() {
  }


  // Function to select class
  classSelect(clase: SubClass, day_index: number): void {
    if (day_index === 0) {
      // we get start time from string and do the calculation to pass a number
      const time: string[] = clase.start.split(':', 2);
      const daytime: string[] = time[1].split(' ', 2);
      let hour: number = parseInt(time[0])
      const minutes: number = parseInt(daytime[0])
      if (daytime[1] === 'pm' && hour != 12) {
        hour = hour + 12;
      }
      hour += minutes / 60;
      // we get the current time and add 15 minutes
      const current: number = new Date().getHours() + ((new Date().getMinutes() + 15) / 60);
      // if class is within 15 minutes or passed user cannot reserve
      if (hour <= current) {
        swal('Ya no puedes reservar esta clase', '', '');
        return;
      }
    }
    // asign variables to the sub_class object
    this.bookProcess.sub_class = clase;
    this.bookProcess.booked = false;
    this.bookProcess.sub_init = true;
    this.bookProcess.sub_class = clase;
    this.getReservations(clase.$key);
    // If it doesnt exists creat it and pass id to function
  }

  // function to check existing reservations in a subclass:
  getReservations(sub_class: string): void {
    // if already subscibe restart sub
    if (this.sub) this.sub.unsubscribe();
    this.sub = this.bookingService.getBookingBySubClass(sub_class).subscribe(bookings => {
      // create array with necesary spaces
      this.bookProcess.bookings = Array(this.bookProcess.sub_class.type === 'Indoor Cycling' ? 17 : 6).fill('');
      // if there are bookings
      if (bookings.length > 0) {
        // for each booking that belogs to the subclass we check the status
        bookings.forEach(book => {
          switch (book.status) {
            case 'canceled':
              break;
            case 'assisted':
            case 'confirmed':
              this.bookProcess.bookings[book.spot] = book;
              break;
            case 'selected':
              // firebase error returing new object without timestamo
              if (!book.createdOn) {
                this.bookProcess.bookings[book.spot] = book;
              }
              // if its selected and not yet confirmed we check if less than 6 minutes have passed
              else if (((firebase.firestore.Timestamp.now().seconds - book.createdOn.seconds) / 60) < 6) {
                this.bookProcess.bookings[book.spot] = book;
              }
              break;
            default:
              this.bookProcess.bookings[book.spot] = book;
          }
        });
      }
      // if its the first time we call the subscripcion, than user selected bike and we should move to next step
      if (this.bookProcess.sub_init) {
        this.bookProcess.sub_init = false;
        this.show_modal = true;
        this.nextStep();
      }
    });
  }

  // function to check if bike is reserved for a subclass
  isReserved(spot: number): boolean {
    return this.bookProcess.bookings[spot] ? true : false;
  }

  // function to select the bike 
  bikeSelect(bike_number: number): void {
    //we save the book proccess
    if (this.isReserved(bike_number)) {
      swal({ title: 'Esta bici ya está reservada', text: 'Por favor selecciona otra', type: '' })
      return;
    }
    // save bike 
    if (this.checkUser()) {
      this.bookProcess.bike = bike_number;
      if (!this.bookProcess.extras) this.bookProcess.extras = [];
      swal({
        title: 'Confirma la reserva',
        text: `Para la clase de ${this.bookProcess.sub_class.instructor.name}, el ${this.bookProcess.sub_class.date} en el lugar ${this.bookProcess.bike}`,
        type: '',
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      }).then(() => {
        this.addUserToClass().then(res => {
          if (res) {
            this.nextStep();
          }
        });
      })
    }
  }


  // fuction to add user to class
  addUserToClass(): Promise<boolean> {
    const booking: Booking = {
      status: 'confirmed',
      name: `${this.user.name} ${this.user.last_name}`,
      sub_class: this.bookProcess.sub_class.$key,
      user: this.user.$key,
      instructor: this.bookProcess.sub_class.instructor,
      date: this.bookProcess.sub_class.date,
      dateObj: this.bookProcess.sub_class.dateObj,
      type: this.bookProcess.sub_class.type,
      time: this.bookProcess.sub_class.start + ' - ' + this.bookProcess.sub_class.end,
      spot: this.bookProcess.bike,
      extras: [],
      free: this.special_payment ? true : false
    };
    if (this.user.fitpass) booking.fitpass = true;
    return new Promise((resolve) => {
      this.bookingService.createBooking(booking).then((id: any) => {
        // we check if booking already exists
        if (id == 'bookingduplicated') {
          swal('Tu lugar ya fue reservado', 'Porfavor selecciona nuevamente', '');
          resolve(false);
        } else {
          this.bookProcess.booking_id = id.id;
          // if we need to deduct credits update user and log success
          if (!this.user.fitpass && !this.special_payment && !this.user.subscription || this.user.plan_id === 6) {
            this.user.credits--;
            if (this.user.credits < 0) this.user.credits = 0;
            this.userService.updateUser(this.user).then(() => {
              this.logger.info(`Admin-Agregar-UsarioClase, usuario ${this.user.$key}, clase ${this.bookProcess.sub_class.$key}, booking ${id.id} special ${this.special_payment ? this.special_payment : 'No'}`);
              resolve(true);
            })
            // else just log success
          } else {
            this.logger.info(`Admin-Agregar-UsarioClase, usuario ${this.user.$key}, clase ${this.bookProcess.sub_class.$key}, booking ${id.id} special ${this.special_payment ? this.special_payment : 'No'}`);
            resolve(true);
          }

        }
      });
    });
  }

  //function to check user's payment status
  checkUser(): boolean {
    // if fitpass checked or special_ṕayment
    if (this.user.fitpass || this.special_payment) {
      return true;
    }
    // we search for the user in the bookings array
    const i = this.bookProcess.bookings.findIndex(book => book.user == this.user.$key);
    // if we the found the user && he has a subscription take him back
    if (i !== -1 && this.user.subscription && !this.user.fitpass && this.user.plan_id !== 9) {
      swal('¡Tienes una membresía!', 'No puedes reservar mas de una vez la misma clase', '');
      return false;
    }
    // if user plan expired
    if (moment(this.user.plan_expiration, 'LL').toDate() < moment().toDate()) {
      swal('El usuario no tiene una membresia activa', '', '')
      return false;
    }
    // if user is not subscribed and out of credits
    if (this.user.credits < 1 && (!this.user.subscription || this.user.plan_id === 6 || this.user.plan_id === 9)) {
      swal('El usuario no tiene suficientes créditos', '', '')
      return false;
    }
    return true;
  }


  sendEmail(): void {
    const email = {
      to: this.user.email,
      from: 'hola@carpe-diem.mx',
      template: 1,
      data: `${this.bookProcess.sub_class.type} \n
      ${this.bookProcess.sub_class.date} \n
      Hora: ${this.bookProcess.sub_class.start}\n
      Instructor:${this.bookProcess.sub_class.instructor.name} \n
      Bici: ${this.bookProcess.bike}`
    }
    this.http.post('/sendEmailT', email).subscribe(res => {
      console.log(res)
    }, error => {
      console.log(error);
    });
  };
  // function to advance the book proccess
  nextStep(): void {
    this.bookProcess.index++;
  }

  // functiont to go back in the book proccess
  prevStep(): void {
    // date reset
    if (this.bookProcess.index === 1) {
      this.week_start = moment().format('LL');
      this.week_end = moment().add(6, 'days').format('LL');
      this.date = moment().subtract(1, 'days');
    }
    this.bookProcess.index--;
  }

  // fuction to create a array with n numbers for the NgFor
  array(n: number): number[] {
    return Array(n);
  }


  // function to check if a class has started
  checkStart(clase: Class, day: number): boolean {
    if (day === 0) {
      // we get start time from string and do the calculation to pass a number
      const time: string[] = clase.start.split(':', 2);
      const daytime: string[] = time[1].split(' ', 2);
      let hour: number = parseInt(time[0])
      const minutes: number = parseInt(daytime[0])
      if (daytime[1] === 'pm' && hour != 12) {
        hour = hour + 12;
      }
      hour += minutes / 60;
      // we get the current time and add 15 minutes
      const current: number = new Date().getHours() + ((new Date().getMinutes() + 15) / 60);
      // if class is within 15 minutes or passed user cannot reserve
      if (hour <= current) {
        return false;
      } else {
        return true;
      }
    }
    return true;
  }

  ngOnDestroy(): void {
    // On exit if the user booked we make sure to reset service BookPorcess, so we can start a new book on reenter to this component
    this.bookingService.resetBook();

    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

}
