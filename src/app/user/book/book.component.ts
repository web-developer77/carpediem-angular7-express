import { Component, OnInit } from '@angular/core';
import { Class } from '../../shared/models/class';
import { BookProcess } from '../../shared/models/bookProcess';
import { take } from 'rxjs/operators'
import * as moment from 'moment';
import { AuthService } from '../../shared/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from 'src/app/shared/models/user';
import ExtrasJson from '../../../assets/json/extras.json';
import { OpenPayService } from '../../shared/services/openpay.service';
import { UserService } from 'src/app/shared/services/user.service';
import { SubClass } from 'src/app/shared/models/sub_class';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { Booking } from 'src/app/shared/models/bookings';
import { BookingService } from 'src/app/shared/services/booking.service';
import { forkJoin, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Email } from 'src/app/shared/models/email';
import { PurchaseService } from 'src/app/shared/services/purchase.service';
import { Purchase } from 'src/app/shared/models/purchase';
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
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss']
})

export class BookComponent implements OnInit {
  loading = false;
  loadingClasses = true;
  bookProcess: BookProcess = new BookProcess();
  sub_classes: SubClass[] = [];
  sub_classes_copy: SubClass[] = [];
  extras: Extras[] = ExtrasJson;
  week: boolean[] = [true, false, false, false];
  week_index = 0;
  user: User;
  date_filter: any;
  filter = 'Indoor Cycling';
  url_redirect: string;
  sub: any;
  sub_booking;
  sub_class: SubClass = new SubClass();
  classByDay: Array<SubClass[]> = [];


  constructor(
    private authService: AuthService,
    private router: Router,
    private openPayService: OpenPayService,
    private userService: UserService,
    private subClassService: SubClassService,
    private bookingService: BookingService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private purchaseService: PurchaseService,
    private logger: NGXLogger,
  ) {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.bookProcess = bookingService.getBook()
  }

  ngOnInit() {
    this.bookProcess.week_start = moment().format('LL');
    this.bookProcess.week_end = moment().add(6, 'days').format('LL');
    this.bookProcess.date_start = moment().subtract(1, 'days');
    this.url_redirect = `${window.location.origin}/carpe/book/`;
    this.date_filter = moment();
    // class and user get
    if (this.user) {
      this.userService.getUserByKey(this.user.$key).pipe(take(1)).subscribe(user => {
        this.user = user;
        this.initFunction();
      });
    } else {
      this.initFunction();
    }
  }

  initFunction() {
    // we get yesterday's date from query
    const d = new Date();
    d.setDate(d.getDate() - 1);
    if (!this.user) {
      this.router.navigate(['/login']);
      return false;
    }
    // get only future sub clases
    this.subClassService.getSubClassFromDate(d).pipe(take(1)).subscribe(subs => {
      // gruop by date
      for (let i = 0; i < 28; i++) {
        this.classByDay[i] = subs.filter(sub => sub.date === moment().add(i, 'days').format('LL').toString());
      }
      this.loadingClasses = false;

      // if navegated with a class type we filter by the type
      this.route.paramMap.pipe(take(1)).subscribe(paramMap => {
        this.filter = paramMap.has('type') ? paramMap.get('type') : 'Indoor Cycling';
      });

      // we check for a payment transition OpenPay 3Ds 
      this.route.queryParams.subscribe(params => {
        // if there is a payment we validate it
        if (params['id']) {
          const id = params['id'];
          const payment = JSON.parse(localStorage.getItem('payment'));
          localStorage.removeItem('payment');
          this.openPayService.getTransaction(id).subscribe((res) => {
            if (res.status === 'completed') {
              // double check that its a payment and the id in local is same as link id
              if (payment) {
                if (payment.id === id) {
                  this.processPayment(payment, res);
                }
              }
              // if payment was not compleated
            } else {
              swal('Ocurrio un error con tu pago', this.getError(res.error_code), '');
            }
          });
          // if no payment transition we check for an existing booking process 
        } else {
          //We get the book proccess from service, the object here and there acts as a singleton, 
          //every edit here applies to that object two, until create a new bookPorces() object with resetBook function
          this.bookProcess = this.bookingService.getBook();
          // if there is a book proccess than index(step) will be higher than 0
          if (this.bookProcess.index !== 0) {
            this.retriveBookState();
          }
        }
      });
    });
  }

  // function to proccess payments
  processPayment(payment: any, res: any): void {
    // we send email and save card if add_card flag
    this.user.new = false;
    this.user.openPay_id = res.customer_id;
    this.user.credits += payment.package.classes;
    this.user.plan_expiration = moment().add(payment.package.expiration, 'days').format('LL').toString();
    if (payment.add_card) {
      this.user.credit_cards.push(res.card.id);
    }
    this.sendEmailPurchase(payment.package);
    this.addPurchasessUser(payment);
  }

  // function to retrive book process
  retriveBookState(): void {
    // We check that user is logged , than if he already selected a bike and we have the booking id
    if (this.checkUser()) {
      if (this.bookProcess.bike) {
        if (this.bookProcess.booking_id) {
          // we check that we can book and that we know shoe size, than we go to the next step
          if (this.checkUserPayment()) {
            if (this.checkUserShoes()) {
              this.nextStep();
            }
          }
        }
      }
    }
  }

  // function to get erros in payment process
  getError(code: number): string {
    switch (code) {
      case 3001:
        return 'La tarjeta ha sido rechazada. Contacte a su banco.';
      case 3002:
        return 'La tarjeta ha expirado. Por favor intente con otra tarjeta.';
      case 3003:
        return 'La tarjeta no tiene fondos suficientes. Por favor intente con otra tarjeta.';
      case 3004:
        return 'La tarjeta tiene un reporte de robo, se notificará el intento de transacción.';
      case 3005:
        return 'La tarjeta ha realizado operaciones fraudulentas. Contacte a su banco.';
      case 3006:
        return 'Esta operación no es válida para este cliente o transacción. Contacte a su banco.';
      case 3007:
        return 'Esta operación no es válida para este cliente o transacción. Contacte a su banco.';
      case 3008:
        return 'Su tarjeta no soporta transacciones en línea. Intente con otra tarjeta.';
      case 3009:
        return 'La tarjeta tiene un reporte de extravío. Contacte a su banco';
      case 3010:
        return 'La tarjeta tiene una restricción de su banco. Contacte a su banco.';
      case 3011:
        return 'El banco ha solicitado se retenga esta tarjeta. Contacte a su banco.';
      case 3012:
        return 'Necesita autorización del banco para realizar esta transacción. Contacte a su banco.';
      default:
        return 'No hemos podido procesar su pago en este momento';
    }
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
          if (book.spot > this.bookProcess.bookings.length)
            return;
          switch (book.status) {
            case 'canceled':
              break;
            case 'assisted':
            case 'confirmed':
              this.bookProcess.bookings[book.spot] = book;
              if (this.user.$key === book.user) this.bookProcess.user = true;
              break;
            case 'selected':
              // firebase error returing new object without timestamo
              if (!book.createdOn) {
                this.bookProcess.bookings[book.spot] = book;
                if (this.user.$key === book.user) this.bookProcess.user = true;
              }
              // if its selected and not yet confirmed we check if less than 6 minutes have passed
              else if (((firebase.firestore.Timestamp.now().seconds - book.createdOn.seconds) / 60) < 6) {
                this.bookProcess.bookings[book.spot] = book;
                if (this.user.$key === book.user) this.bookProcess.user = true;
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
        this.nextStep();
      }
    });
  }

  //function to show alert for classes 2 weeks in advance
  showAlert(): void {
    swal('Aún no puedes reservar esta clase', 'Por el momento únicamente aceptamos reservaciones con 1 semana de anticipación', '')
  }

  // function to check if bike is reserved for a subclass
  isReserved(spot: number): boolean {
    return this.bookProcess.bookings[spot] ? true : false;
  }

  // function to select the bike 
  bikeSelect(bike_number: number): void {
    //we save the book proccess
    if (this.isReserved(bike_number)) {
      swal({ title: 'Este lugar ya está reservado', text: 'Por favor selecciona otro', type: '' })
      return;
    }
    if (this.checkCreditAndPlan()) {
      if (this.checkUser()) {
        // save bike in subclass

        this.bookProcess.bike = bike_number;
        this.addUserToClass().then(res => {
          // if user was added to class, check payment and shoe size
          if (res) {
            if (this.checkUserPayment()) {
              if (this.checkUserShoes()) {
                // if user doesnt have a credits card go confirm booking
                if (this.user.credit_cards.length === 0) {
                  if (!this.bookProcess.extras) this.bookProcess.extras = [];
                  swal({
                    title: 'Confirma tu reserva',
                    text: `Para la clase de ${this.bookProcess.sub_class.instructor.name}, el ${this.bookProcess.sub_class.date} en el lugar ${this.bookProcess.bike}`,
                    type: '',
                    showCancelButton: true,
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Confirmar",
                    cancelButtonText: "Cancelar",
                  }).then(() => {
                    this.nextStep();
                    this.confirmBooking();
                  })
                } else {
                  this.nextStep();
                }
              }
            }
          }
        });
      }
    }
  }

  // function to check if having credits or unlimit plan

  checkCreditAndPlan(): boolean {
    if (this.user.credits === 0) {
      if (this.user.plan_id === 7 || this.user.plan_id === 8) {
        if (this.bookProcess.user) {
          swal('Solo puedes reservar un lugar por clase.', '', '');
          return false;
        }
      } else {
        swal('No tienes créditos', '', '');
        this.router.navigateByUrl('/carpe/buy')
        return false;
      }
    }
    return true;
  }
  // function to check if user is logged in;
  checkUser(): boolean {
    if (!this.user) {
      this.authService.setBook();
      this.router.navigate(['/login']);
      return false;
    }
    // admin cant reserve classes
    if (this.user.admin) {
      swal('El admin solo puede reservar clases en en panel', '', '')
      return false;
    }
    // we search for the user in the bookings array
    const i = this.bookProcess.bookings.findIndex(book => book.user == this.user.$key);
    console.log(this.bookProcess.bookings);
    // if we the found the user && he has a subscription take him back
    if (i !== -1 && this.user.subscription && this.user.plan_id !== 9) {
      swal('¡Tienes una membresía!', 'No puedes reservar mas de una vez la misma clase', '');
      return false
    }
    return true;

  }

  // fuction to add user to class
  addUserToClass(): Promise<boolean> {
    const booking: Booking = {
      status: 'selected',
      name: `${this.user.name} ${this.user.last_name}`,
      sub_class: this.bookProcess.sub_class.$key,
      user: this.user.$key,
      instructor: this.bookProcess.sub_class.instructor,
      date: this.bookProcess.sub_class.date,
      dateObj: this.bookProcess.sub_class.dateObj,
      type: this.bookProcess.sub_class.type,
      time: this.bookProcess.sub_class.start + ' - ' + this.bookProcess.sub_class.end,
      spot: this.bookProcess.bike,
      extras: []
    };
    return new Promise((resolve) => {
      this.bookingService.createBooking(booking).then((id: any) => {
        // we check if booking already exists
        if (id == 'bookingduplicated') {
          swal('Tu lugar ya fue reservado', 'Porfavor selecciona nuevamente', '');
          resolve(false);
        } else {
          // the booking was saved we take the id and start a timer 
          this.bookProcess.booking_id = id.id;
          this.bookingService.setTimer();
          this.logger.info(`Usuario-Reservacion-Iniciada: usuario ${this.user.name} ${this.user.last_name} ${this.user.$key}, booking ${id.id}`);
          resolve(true);
        }
      });
    });
  }


  //function to check user's payment status
  checkUserPayment(): boolean {
    // if user plan expired
    if (moment(this.user.plan_expiration, 'LL').toDate() < moment().toDate()) {
      this.bookProcess.date = new Date();
      localStorage.setItem('bookProcess', JSON.stringify(this.bookProcess))
      this.router.navigate(['/carpe/buy']);
      return false;
    }
    // if user is not subscribed and out of credits
    if (this.user.credits < 1 && (!this.user.subscription || this.user.plan_id === 6)) {
      this.bookProcess.date = new Date();
      localStorage.setItem('bookProcess', JSON.stringify(this.bookProcess))
      this.router.navigate(['/carpe/buy']);
      return false;
    }
    return true;
  }

  // function to check if user has selected shoes
  checkUserShoes(): boolean {
    //If user never selected shows go to component 
    if (!this.user.shoe_size) {
      this.router.navigate(['/carpe/tennis']);
      return false;
    } else {
      return true;
    }
  }

  // function to select the extras
  selectExtras(): void {
    if (!this.bookProcess.extras) this.bookProcess.extras = [];
    let total = 0;
    // we loop the extras to verify if user selected an item and add the price to the total
    this.extras.forEach(extra => {
      if (extra.ammount > 0) {
        total += extra.ammount * extra.price;
      }
    });
    // if user selected an item
    if (total > 0) {
      // swal to confirm payment
      swal({
        title: 'Confirma tu compra',
        text: `Tu trajeta será cargada por un total de $${total}`,
        type: "",
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      }).then(() => {
        // payment process
        this.selectCard().then(card => {
          this.loading = true;
          this.openPayService.sendPayment(card, this.user.openPay_id, total, this.url_redirect, false, 'Extras').pipe(take(1)).subscribe((res) => {
            // if couldnot porcess payment
            if (res.error_code) {
              this.loading = false;
              swal({ title: this.getError(res.error_code), text: 'Puedes comprar tus extras antes de la clase.', type: '' })
              this.confirmBooking();

              // if payment was processed  
            } else if (res.status === 'completed') {
              // save extras in temp array;
              this.extras.forEach(extra => {
                if (extra.ammount > 0) {
                  this.bookProcess.extras.push(extra);
                }
              });
              this.loading = false;
              swal({ title: 'Transaccion exitosa', text: 'Estos seran entregados antes de la clase', type: '' });
              this.confirmBooking();

              // fullback in case is not an error and its nor compleated  
            } else {
              this.loading = false;
              swal({ title: 'Ocurrio un error', text: 'Puedes comprar tus extras antes de la clase.', type: '' })
              this.confirmBooking();
            }
          });
        })
      }).catch(swal.noop);
      // if user did not select extras confirm booking
    } else {
      this.confirmBooking();
    }
  }

  //Function to select a card and return it as a promise
  selectCard(): Promise<string> {
    let cards_observable: Observable<any>[] = [];
    let credit_cards = {};
    if (this.user.credit_cards.length > 0) {
      this.user.credit_cards.forEach((card) => {
        cards_observable.push(this.openPayService.getClientCard(card, this.user.openPay_id));
      });
      return new Promise((resolve, reject) => {
        forkJoin(cards_observable).pipe(take(1)).subscribe(cards => {
          cards.forEach(card => {
            credit_cards[card.id] = card.card_number;
          });
          swal({
            title: 'Selecciona una tarjeta de crédito',
            text: `La trajeta seleccionada sera cargada`,
            input: 'select',
            inputOptions: credit_cards,
            inputPlaceholder: 'Selecciona la opción',
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
          }).then((card) => {
            if (card) {
              resolve(card);
            } else {
              swal('Error!', 'Por favor ayúdanos a seleccionar una opción', '')
              reject('error');
            }
          }).catch(swal.noop);
        });
      })
    }
  }

  // function to confrim booking
  confirmBooking(): void {
    // get latest user infromation
    this.userService.getUserByKey(this.user.$key).pipe(take(1)).subscribe(user => {
      this.user = user;
      // double check the cresits
      if (user.credits > 0 || (user.subscription && user.plan_id !== 6 && user.plan_id !== 9)) {
        // retreve booking from database
        this.bookingService.getBookingById(this.bookProcess.booking_id).pipe(take(1)).subscribe((book) => {
          // if more than 6 minutes have passed since user selected bike
          if (((firebase.firestore.Timestamp.now().seconds - book.createdOn.seconds) / 60) > 6) {
            this.bookingService.checkAvailable(this.user.$key, book.spot, book.sub_class).then(res => {
              // if its not available
              if (!res) {
                swal('Lo sentimos el lugar ya no se encuentra disponible', 'Porfavor selecciona nuevamente', '')
                this.bookProcess.index = 1;
                return;
              } else {
                this.updateBookingUser(book);
              }
            });
          } else {
            this.updateBookingUser(book);
          }
        });
        // After double check booking, change status to confirmed add extras and save
      } else {
        swal('Ya no tienes créditos', '', '')
        this.prevStep();
        this.prevStep();
      }
    });
  }

  // function to update user and booking after confirmation
  updateBookingUser(book: Booking) {
    book.status = 'confirmed';
    book.extras = this.bookProcess.extras;
    book.$key = this.bookProcess.booking_id;
    if (!this.user.subscription || this.user.plan_id === 6 || this.user.plan_id === 9) {
      this.user.credits--;
      if (this.user.credits < 0) this.user.credits = 0;
    }
    this.bookingService.updateBookingUser(book, this.user).then(() => {
      this.logger.info(`User-Reservacion-Confirmada, usuario ${this.user.name} ${this.user.last_name} ${this.user.$key}, booking ${this.bookProcess.booking_id}`)
      this.authService.SetLocal(this.user);
      this.bookProcess.booked = true;
      this.sendEmail();
      // copy info for confirmation page
      this.sub_class = this.bookProcess.sub_class;
      this.nextStep();
    }).catch((err) => {
      console.log(err);
    });
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
    this.bookProcess.index++
  }

  // functiont to go back in the book proccess
  prevStep(): void {
    // date reset
    if (this.bookProcess.index === 1) {
      this.bookProcess.week_start = moment().format('LL');
      this.bookProcess.week_end = moment().add(6, 'days').format('LL');
      this.bookProcess.date_start = moment().subtract(1, 'days');
    }
    // bike reset
    if (this.bookProcess.index === 2) {
      // delte booking
      this.bookingService.deleteBooking(this.bookProcess.booking_id);
      this.logger.info(`User-Reservacion-NoTerminada-BackComponent, usuario ${this.user.$key}, booking ${this.bookProcess.booking_id}`);
      this.bookingService.cancelTimeout();
    }
    this.bookProcess.index--;
  }

  // function a advance a week in the class calandar
  nextWeek(): void {
    this.bookProcess.week_start = moment().add(++this.week_index * 7, 'days').format('LL');
    this.bookProcess.week_end = moment().add(this.week_index * 7 + 6, 'days').format('LL');
    this.week.fill(false)
    this.week[this.week_index] = true;
  }

  // function to go back a week in the class calendar
  prevWeek(): void {
    this.bookProcess.week_start = moment().add(--this.week_index * 7, 'days').format('LL');
    this.bookProcess.week_end = moment().add(this.week_index * 7 + 6, 'days').format('LL');
    this.week.fill(false)
    this.week[this.week_index] = true;
  }


  // fuction to create a array with n numbers for the NgFor
  array(n: number): number[] {
    return Array(n);
  }

  // function to save purachse object in db
  addPurchasessUser(payment: any): void {
    const purchase_object: Purchase = {
      user: this.user.$key,
      amount: payment.amount,
      package: payment.package.name,
      subscription: payment.package.subscription,
      date: moment().format('l'),
      expiration: moment().add(payment.package.expiration, 'days').format('LL').toString(),
      expirationObj: moment().add(payment.package.expiration, 'days').toDate(),
      card: payment.card.card_number
    };
    this.user.plan = payment.package.name;
    if (payment.package.subscription) {
      this.user.subscription_count++;
      purchase_object.subscription_count = this.user.subscription_count;
    } else {
      this.user.subscription_count = 0;
    }
    this.purchaseService.createPurchaseUpdateUser(purchase_object, this.user).then(() => {
      this.authService.SetLocal(this.user);
      this.bookProcess = this.bookingService.getBook();
    });
  }


  // functiont to send purchase emial to user
  sendEmailPurchase(purchase: any): void {
    const email: Email = {
      to: this.user.email,
      from: 'hola@carpe-diem.mx',
      subject: 'Gracias por tu compra',
      html: `<h2> ¡Gracias por ser parte de nuestra familia! Tu compra ha sido registrada.</h2>
            <h5>Datos de la compra</h5>
            <ul>
            <li>  Paquete: ${purchase.name}</li> 
            <li>  Precio: ${purchase.name}</li> 
            <li>  Expiración: ${purchase.expiration}</li> 
            </ul>
            <p> ¡Nos vemos pronto! \n
            Tu, aquí, ahora. \n
            CARPE DIEM </p>`
    }
    this.http.post('/sendEmail', email).subscribe(res => {
      console.log(res);
    }, error => {
      console.log(error);
    });
  };

  //script to retrive bookings 
  retriveBookingsFromBookings() {
    this.bookingService.getBookingsInfo().subscribe(bookings => {
      bookings.forEach(book => {
        this.subClassService.getSubClassById(book.sub_class).pipe(take(1)).subscribe(sub => {
          if (sub.users) {
            const i = sub.users.findIndex(user => user.bike == book.spot);
            if (i === -1) {
              console.log('no')
              sub.users.push({ bike: book.spot, user: book.user, extras: [] });
              this.subClassService.updateSubClass(sub)
            } else {
              if (sub.users[i].user !== book.user) {
                console.log(sub.users[i])
                console.log(book);
              }
              console.log('yes')
            }
          }
        })
      })
    })
  }

  retriveBookingsFromSubClass() {
    this.subClassService.getSubClassesInfo().pipe(take(1)).subscribe(subs => {
      subs.forEach(sub => {
        sub.users.forEach(user => {
          if (user.bike && user.user) {
            this.bookingService.getBookingBySpot(sub.$key, user.bike, user.user).pipe(take(1)).subscribe(booking => {
              if (booking.length === 0) {
                this.userService.getUserByKey(user.user).pipe(take(1)).subscribe(_user => {
                  const _booking: Booking = {
                    status: user.confirmed ? 'assisted' : 'confirmed',
                    name: `${_user.name} ${_user.last_name}`,
                    sub_class: sub.$key,
                    user: user.user,
                    instructor: sub.instructor,
                    date: sub.date,
                    dateObj: sub.dateObj,
                    type: sub.type,
                    time: sub.start + ' - ' + sub.end,
                    spot: user.bike,
                    extras: user.extras
                  };
                  this.bookingService.createBooking(_booking).then(() => {
                    console.log("created");
                  })
                })
              }
            })
          } else {
            console.log(user)
            console.log(sub)
          }
        });
      });
    })
  }

  addCreatedOn() {
    this.bookingService.getBookingsInfo().pipe(take(1)).subscribe(bookings => {
      bookings.forEach(element => {
        element.status = 'confirmed';
        this.bookingService.updateBooking(element)
      });
    });
  }

  giveNameToBooking() {
    this.bookingService.getBookingsInfo().pipe(take(1)).subscribe(bookings => {
      bookings.forEach(book => {
        if (!book.name) {
          this.userService.getUserByKey(book.user).pipe(take(1)).subscribe(user => {
            book.name = user.name + ' ' + user.last_name;
            this.bookingService.updateBooking(book).then(() => {
              console.log("name")
            });
          });
        }
      })
    });
  }

  setBookings() {
    this.subClassService.getSubClassesInfo().pipe(take(1)).subscribe(subclass => {
      subclass.forEach(sub => {
        this.bookingService.getBookingBySubClass(sub.$key).pipe(take(1)).subscribe(bookings => {
          bookings.forEach(book => {
            let _user = sub.users[sub.users.findIndex(u => u.user == book.user && u.bike == book.spot)];
            if (_user) {
              if (book.status == 'selected') {
                if (_user.confirmed) {
                  book.status = 'assisted';
                } else {
                  book.status = 'confirmed'
                }
                book.extras = _user.extras;
                this.bookingService.updateBooking(book).then(() => {
                  console.log("updated")
                })
              }
            }
          })
        })
      })
    })
  }

  setStatus() {
    this.bookingService.getBookingsInfo().pipe(take(1)).subscribe(bookings => {
      bookings.forEach(book => {
        if (!book.status) {
          book.status = 'confirmed';
          this.bookingService.updateBooking(book).then(() => {
            console.log("updated")
          })
        }
      })
    })
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
    // If user didnt book we let book state as it was, with the timer in the service in charge or reseting the book after 6 minutes
    if (this.bookProcess.booked) {
      this.bookingService.resetBook();
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
    // check if book was finished
  }
}
