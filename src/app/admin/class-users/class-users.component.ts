import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { SubClassService } from '../../shared/services/sub_class.service';
import { SubClass } from '../../shared/models/sub_class';
import { UserService } from 'src/app/shared/services/user.service';
import { map, startWith, take } from 'rxjs/operators';
import { Booking } from 'src/app/shared/models/bookings';
import { BookingService } from 'src/app/shared/services/booking.service';
import * as moment from 'moment';
import { NGXLogger } from 'ngx-logger';
import { User } from 'src/app/shared/models/user';
import { HttpClient } from '@angular/common/http';
declare var swal: any

@Component({
  selector: 'app-class-users',
  templateUrl: './class-users.component.html',
  styleUrls: ['./class-users.component.scss']
})
export class ClassUsersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['name', 'spot', 'extras', 'status', 'lateCancel'];
  sub_class: SubClass = new SubClass();
  dataSource = new MatTableDataSource<Booking>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  loading = true;
  bookings: Booking[];
  futureClass = false;
  usersResults: User[];
  usersResultsFiltered: any;
  searchUsers = new FormControl();
  selectedUser: User = new User();
  selectedSeat: number;
  selectedSeats: number[] = [];
  availableSeats = [];
  sub1: any;
  sub2: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private subClassService: SubClassService,
    private userService: UserService,
    private logger: NGXLogger,
    private bookingService: BookingService,
    private http: HttpClient
  ) {
    this.sub2 = this.userService.getUsersInfo().subscribe(users => {
      this.usersResults = users;
      this.usersResultsFiltered = this.searchUsers.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : `${value.name.toLowerCase()} ${value.last_name.toLowerCase()}`),
        map(user => user ? this._filter(user) : this.usersResults.slice())
      );
    })

    this.subClassService.getSubClassById(data.id).pipe(take(1)).subscribe((sub_class) => {
      // fill array with 34 or 15 spots
      this.availableSeats = Array.from({ length: sub_class.type === 'Indoor Cycling' ? 34 : 15 }, (v, k) => k + 1);
      // get subclassmoment(sub_class.date, 'LL')
      this.sub_class = sub_class;
      this.futureClass = moment(sub_class.date, 'LL').isSameOrAfter(moment(), 'day');
      // get bookings and filter canceled and incompleted ones
      this.sub2 = this.bookingService.getBookingBySubClass(data.id).subscribe(bookings => {
        this.loading = true;
        bookings = bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'assisted' || booking.status === 'canceled');
        // bookings.forEach((booking) => {
        //   this.availableSeats.splice(this.availableSeats.indexOf(booking.spot), 1);
        // })
        this.bookings = bookings;
        this.dataSource.data = bookings;
        this.dataSource.sort = this.sort;
        this.loading = false;
      });
    })
  }

  ngOnInit() { }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  displayFn(user) {
    return user ? `${user.name} ${user.last_name}` : undefined;
  }


  addUserToClass() {
    const user = this.selectedUser;
    let temp = 0;
    this.bookings.map((item) => {
      if (item.spot == this.selectedSeat && item.status !== "canceled") {
        swal('Este lugar no está disponible.', '', '');
        temp = -1;
        return;
      }
    })

    if (user.fitpass) {
      this.addFitpass();
      return;
    }
    if (temp == 0) {
      if (this.selectedSeat) {
        if (user.credits > 0 || user.subscription) {
          user.credits--;
          if (user.credits < 0) {
            user.credits = 0;
          }
          this.userService.updateUser(user)
        } else {
          swal('El usuario no tiene creditos', '', '');
          return;
        }
        const booking: Booking = {
          status: 'confirmed',
          name: `${this.selectedUser.name} ${this.selectedUser.last_name}`,
          sub_class: this.sub_class.$key,
          user: this.selectedUser.$key,
          instructor: this.sub_class.instructor,
          date: this.sub_class.date,
          dateObj: this.sub_class.dateObj,
          type: this.sub_class.type,
          time: this.sub_class.start + ' - ' + this.sub_class.end,
          spot: this.selectedSeat,
          extras: []
        };
        if (user.credits === 0) {
          swal("El usuario no tiene créditos.")
        } else {
          this.bookingService.createBooking(booking).then((res: any) => {
            if (res.id) {
              swal('Usuario agregado exitosamente.', '', '')
            } else {
              swal('Ocurrio un error, intentalo nuevamente.', '', '')
            }
          });
        }
      } else {
        swal('Porfavor selecciona un lugar', '', '')
      }
    }

  }

  // function for fitpass user select multiple
  addFitpass() {
    if (this.selectedSeats.length) {
      const promises = [];
      this.selectedSeats.forEach(seat => {
        if (!this.bookings.find((item) => item.status == "confirmed" && item.spot == seat)) {
          const booking: Booking = {
            status: 'confirmed',
            name: `${this.selectedUser.name} ${this.selectedUser.last_name}`,
            sub_class: this.sub_class.$key,
            user: this.selectedUser.$key,
            instructor: this.sub_class.instructor,
            date: this.sub_class.date,
            dateObj: this.sub_class.dateObj,
            type: this.sub_class.type,
            time: this.sub_class.start + ' - ' + this.sub_class.end,
            spot: seat,
            fitpass: true,
            extras: []
          };
          promises.push(this.bookingService.createBooking(booking));
        } else {
          swal('Este lugar no está disponible.', '', '');
        }
      });
      if (promises.length > 0) {
        Promise.all(promises).then(() => {
          swal('Los lugares fitpass han sido reservados', '', '')
        }).catch((err) => swal(err, '', ''))
      }
    } else {
      swal('Porfavor selecciona los lugares de usuario Fitpass', '', '')
    }
  }


  // function to confirm or desconfirm user assisteance
  confirmUser(booking: Booking) {
    swal({
      title: booking.status === 'assisted' ? '¿Cancelar asistencia?' : '¿Confirmar asistencia?',
      type: '',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: "No",
    }).then(() => {
      booking.status = booking.status == 'assisted' ? 'confirmed' : 'assisted'
      this.bookingService.updateBooking(booking);
    })
  }

  // function to cancel a booking
  cancelBooking(booking: Booking): void {
    // we get the class time to know if its a late book
    const time: string[] = booking.time.split(':', 2);
    const daytime: string[] = time[1].split(' ', 2);
    let hour: number = parseInt(time[0])
    const minutes: number = parseInt(daytime[0]) / 100;
    hour += minutes;
    if (daytime[1] === 'pm' && hour !== 12) {
      hour += 12;
    }
    // if its 12 hours before than its a late book
    const lateCancel = moment().add(12, 'hours').isAfter(moment(booking.date, 'LL').add(hour, 'hours'), 'hours');
    swal({
      title: `¿Deseas cancelar esta reservación?`,
      text: lateCancel ? 'La cancelación es con menos de 12 horas de anticipación, el crédito no sera devuelto' : '',
      type: "",
      showCancelButton: true,
      confirmButtonClass: "btn-danger",
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
    }).then(() => {
      let returned = false;
      // we change status of the booking change date to string to save it in db
      booking.status = 'canceled';
      booking.lateCancel = lateCancel;
      // get the booking user
      this.userService.getUserByKey(booking.user).pipe(take(1)).subscribe(user => {
        // if its not fitpass user and user has credits plan and its nor late return credits
        if (!user.fitpass && (!user.subscription || user.plan_id === 6) && !lateCancel) {
          user.credits++;
          returned = true;
        }
        this.bookingService.updateBookingUser(booking, user).then(() => {
          swal('La reservación fue cancelada',
            lateCancel ? 'Al ser una cancelación tardia al usuario no se le devolvieron los créditos' : 'Al usuario se le regresaron los créditos', '');
          this.logger.info(`Admin-Cancelar-Reservacion, booking:${booking.$key} late? ${lateCancel}, bici ${booking.spot}, clase ${booking.sub_class}, credits returned: ${returned}`);
        }).catch((err) => {
          console.log(err);
        });
      })
    }).catch(swal.noop);
  }

  private _filter(name) {
    const filterValue = name.toLowerCase()

    return this.usersResults
      .filter(u => {
        if (this.dataSource.data.filter(d => u.$key === d.$key).length) return false
        return true
      })
      .filter(option => option.name.toLowerCase().indexOf(filterValue) > -1 || option.last_name.toLowerCase().indexOf(filterValue) > -1)
  }

  cancelClass(): void {
    swal({
      title: `¿Estás seguro que deseas ${this.sub_class.canceled ? 'descancelar' : 'cancelar'} esta reservación?`,
      text: "A los usarios se les regresarán los créditos y seran alertados con un mail",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI!',
      cancelButtonText: 'REGRESAR'
    }).then(() => {
      const users = this.dataSource.data.filter(b => b.status === 'confirmed' || b.status === 'assisted').map(u => u.user);
      if (users.length) {
        this.userService.getUsersArray(users).pipe(take(1)).subscribe(users => {
          const promises = [];
          users.forEach(user => {
            if (!user.subscription && !user.fitpass && !this.sub_class.canceled) {
              user.credits++;
            }
            promises.push(this.userService.updateUser(user));
            this.sendEmail(user.email);
          });
          Promise.all(promises).then(() => {
            this.writeCancel();
          }).catch(err => this.logger.info(`Error-Cancelar-Sub: ${err}`))
        });
      } else {
        this.writeCancel();
      }
    }, () => { });
  }

  writeCancel() {
    this.sub_class.canceled = !this.sub_class.canceled;
    this.subClassService.updateSubClass(this.sub_class).then(() => {
      this.logger.info(`Admin-${this.sub_class.canceled ? 'Cancelar' : 'Descancelar'}-subClase: sub${this.sub_class.$key}`)
      swal(`La clase fue ${this.sub_class.canceled ? 'cancelada' : 'descancelada'}!`,
        'Se le envio un correo a los usuarios para notificarles', '');
    }, err => this.logger.info(`Error-Cancelar-Sub: ${err}`));
  }

  sendEmail(to: string) {
    const email = {
      to,
      from: 'hola@carpe-diem.mx',
      template: 3,
      data: `<h2>¡Lo sentimos! La clase ha sido cancelada.</h2>
        <p>Lamentamos informarte que la clase del dia ${this.sub_class.date} con ${this.sub_class.instructor.name} ha sido cancelada, se ha regresado un crédito a tu cuenta</p>
        <p>¡Nos vemos pronto!</p>
        <p>Tú, aquí, ahora.</p>
        <p>CARPE DIEM</p>`
    }
    if (this.sub_class.canceled) {
      email.data = `<h2>Tu clase ha sido descancelada.</h2>
      <p>Te informamos que la clase del dia ${this.sub_class.date} con ${this.sub_class.instructor.name} si se llevará acabo</p>
      <p>¡Nos vemos ahi!</p>
      <p>Tú, aquí, ahora.</p>
      <p>CARPE DIEM</p>`
    }
    this.http.post('/sendEmailT', email).subscribe(res => {
      swal('El email ha sido enviado', '', '')
    }, error => {
      console.log(error);
    });
  }


  ngOnDestroy(): void {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
  }
}
