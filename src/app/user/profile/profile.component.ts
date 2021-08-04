import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { User} from '../../shared/models/user';
import { UserService } from '../../shared/services/user.service';
import * as moment from 'moment'
import {take } from 'rxjs/operators'
import { OpenPayService } from '../../shared/services/openpay.service';
import { NgForm } from '@angular/forms';
import { Booking } from 'src/app/shared/models/bookings';
import { BookingService } from 'src/app/shared/services/booking.service';
import { PurchaseService } from 'src/app/shared/services/purchase.service';
import { Purchase } from 'src/app/shared/models/purchase';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { MatDialog } from '@angular/material';
import { AddCardComponent } from '../add-card/add-card.component';
import PlansJson from '../../../assets/json/plans.json';

declare var swal:any;
declare var $:any;
interface Package{
  id: number;
  subscription: boolean;
  name: string;
  price: number;
  subscription_id?: string;
  classes?: number;
  expiration: number;
}
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User;
  openPayUser: any = {};
  sub: any;
  sub2: any;
  sub3: any;
  loading = true;
  credit_cards: any[] = [];
  bookings: Booking[] = [];
  bookings_filtered: Booking[] = [];
  purchases: Purchase[] = [];
  change_password = false;
  email_confirmation: string;
  password: string;
  new_password: string;
  password_confirmation: string;
  filter = 'incoming';
  expired = true;
  packages: Package [] = PlansJson;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private openPayService: OpenPayService,
    private bookingService: BookingService,
    private purchaseService: PurchaseService,
    private route: ActivatedRoute,
    private logger: NGXLogger,
    private dialog: MatDialog
    
  ) { 
    moment().locale('es');
    this.route.paramMap.pipe(take(1)).subscribe(paramMap => {
      if (paramMap.has('id')) {
        const id = paramMap.get('id');
        // we get user 
        this.sub = this.userService.getUserByKey(id).subscribe((user) =>{
          this.user = user;
          this.expired = moment(user.plan_expiration, 'LL').isBefore(moment());
          this.user.$key = id;
          this.user.born = moment(this.user.born, 'LL').toDate();
          // if he has an openPay id we can reterive his credit cards
          if(this.user.openPay_id) {
            const cardQueries: Observable<any>[] = [];
            this.user.credit_cards.forEach(card => {
              cardQueries.push(this.openPayService.getClientCard(card, this.user.openPay_id).pipe(take(1)));
            })
            if (cardQueries.length > 0){
              forkJoin(cardQueries).subscribe(cards => {
                cards.map((card) => card.brand == 'american_express' ? card.brand = 'american' : card.brand)
                this.credit_cards = cards;
                this.loading = false;
              });
            } else {
              this.loading = false;
            }
          } else {
            this.loading = false;
          }
        });

        // we get all his bookings and sort them by date
        this.sub2 = this.bookingService.getConfirmedBookingsByUser(id).subscribe(bookings =>{
          this.bookings = bookings.sort((a,b) =>  moment(a.date, 'LL').unix() - moment(b.date, 'LL').unix()) ;
          this.filterIncoming();
        });

        // we get all his purchasess and sort them by date
        this.sub3 = this.purchaseService.getPurchaseByUser(id).subscribe(purchases =>{
          this.purchases = purchases.sort((a,b) => moment(a.expiration, 'LL').unix() - moment(b.expiration, 'LL').unix());
          this.purchases.reverse();
        });
      }
    });
  }




  ngOnInit() {
  }

  addCard(){
    this.dialog.open(AddCardComponent, {
      data: { id:  this.user.$key },
    });
  }

  // function to cancel a booking
  cancelBooking(booking: Booking): void {
    // we get the class time to know if its a late book
    const time: string [] = booking.time.split(':', 2);
    const daytime: string[] = time[1].split(' ', 2);
    let hour: number = parseInt(time[0])
    const minutes: number = parseInt(daytime[0]) / 100;
    hour += minutes;
    if(daytime[1] === 'pm' && hour !== 12){
      hour += 12;
    }
    // if its 12 hours before than its a late book
    const lateCancel = moment().add(12, 'hours').isAfter(moment(booking.date, 'LL').add(hour, 'hours'), 'hours');
    swal({
      title: `¿Deseas cancelar tu reservación con ${booking.instructor.name}?`,
      text: lateCancel ? 'Tu cancelación es con menos de 12 horas de anticipación, tu crédito no sera devuelto': '',
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
      this.user.born = moment(this.user.born).format('LL').toString();
      if ((!this.user.subscription || this.user.plan_id === 6 || this.user.plan_id === 9) && !lateCancel){
        this.user.credits++;
        returned = true;
      }
      this.bookingService.updateBookingUser(booking, this.user).then(() =>{
        swal('Tu reservación fue cancelada', '', '');
        this.logger.info(`User-Cancelar-Reservacion, usuario ${this.user.name} ${this.user.last_name}, late? ${lateCancel}, bici ${booking.spot}, clase ${booking.sub_class}, credits returned: ${returned}`);
      }).catch((err) =>{
        console.log(err);
      });
    }).catch(swal.noop);
  }

  // function to show only incoming bookings
  filterIncoming(): void {
    this.filter = 'incoming';
    this.bookings_filtered = this.bookings.filter(booking =>  moment(booking.date, 'LL').isSameOrAfter(moment(), 'day'))
  }

  // function to show only previous bookings
  filterPrevious(): void {
    this.filter = 'previous';
    this.bookings_filtered = this.bookings.filter(booking =>  moment(booking.date, 'LL').isBefore(moment(), 'day'))
    this.bookings_filtered.reverse();
  }

  // function to delete card from openPay
  deleteCard(card:any): void{
    swal({
      title: `¿Deseas borrar esta tarjeta`,
      text: 'No podra ser borrada si se utiliza para una subscripción ',
      type: "",
      showCancelButton: true,
      confirmButtonClass: "btn-danger",
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
    }).then(() => {
      // We delete catd 
      this.openPayService.deleteClientCard(card.id, this.user.openPay_id).pipe(take(1)).subscribe(res => {
        // if res is not empy than there was a mistake
        if(res){
          swal({title: 'Ocurrio un error', text: res.description, type: ''});
        // otherwise delete card change date to strinf and uodate user and log it  
        } else {
          this.user.credit_cards.splice(this.user.credit_cards.indexOf(card.id), 1);
          this.user.born = moment(this.user.born).format('LL').toString();
          this.userService.updateUser(this.user).then(() => {
            this.logger.info(`User-Borrar-Tarjeta, usuario ${this.user.name} ${this.user.last_name}, tarjeta ${card.id}`);
            swal('La tarjeta fue eliminada', '', '')
          })
        }
      });
    }).catch(swal.noop);
  }

  // Funtion to log out user
  logOut(): void {
    this.authService.SignOut();
  }

  // function to update iser
  updateUser(form: NgForm){
    // we must change date to string for db 
    this.user.born = moment(this.user.born).format('LL').toString();
    this.userService.updateUser(this.user).then(() => {
      swal('Tu información fue actualizada', '', '');
      // if he is changing password check that both are the same
      if(this.change_password){
        if(this.new_password === this.password_confirmation){
          // we must relog user to update password
          this.authService.SignIn(this.user.email, this.password, false).then(()=>{
            // after log in change password show modal and log it
            this.authService.changePassword(this.new_password).then((res)=>{
              swal('Tu contraseña fue actualizada', '', '');
              this.logger.info(`User-Actualizar-Contraseña, usuario ${this.user.name} ${this.user.last_name}`);
            }, (err) =>{
              console.log(err);
            })
          }, (err) =>{
            console.log(err)
          });
        } else {
          swal('Las nuevas contraseñas no coinciden', 'Porfavor verifica tu información', '');
        }
      };
    }, err =>{
      console.log(err);
    })
  }

  // Function to cancel a plan renovation in OpenPay
  cancelRenovation(){
    swal({
      title: `¿Quieres cancelar la renovación del plan`,
      text: 'Podras seguir utilizando tu plan hasta su expiración',
      type: "",
      showCancelButton: true,
      confirmButtonClass: "btn-danger",
      confirmButtonText: "Si, Cancelar",
      cancelButtonText: "Regresar",
    }).then(() => {
      // we cancel the plan with the plan and customer id, if res is not empty there was a mustaje
      this.openPayService.cancelSubscription(this.user.open_plan, this.user.openPay_id).pipe(take(1)).subscribe((res) => {
        if(res){
          swal({title: 'Ocurrio un error', text: res.description, type: ''});
        } else {
          const cancel = {
            date: moment().toDate(),
            user: this.user.$key,
            plan: this.user.plan
          }
          this.userService.cancelSubscription(cancel).then(() => {
            swal('La renovación de tu subscripción ha sido cancelada', '', '')
            this.logger.info(`User-Cancelar-Plan, usuario ${this.user.name} ${this.user.last_name}, Plan ${this.user.open_plan}, Id_open ${this.user.open_plan}`);
          })
        }
      });
    }).catch(swal.noop);
  }

  subscriptionPlanName(plan_id) {
    const currentPlan = this.packages.find((elem) => elem.id === parseInt(plan_id));
    return currentPlan.name;
  }

  getCreditsDate() {
    const credPurchase = this.purchases.filter(elem => !elem.subscription);
    const sortedList = credPurchase.sort((a, b) => b.expiration - a.expiration)
    if (sortedList.length > 0) {
      return sortedList[0].expiration
    } else {
      return null;
    }
  }

  getPlanDate() {
    const planPurchase = this.purchases.filter(elem => elem.subscription);
    const sortedList = planPurchase.sort((a, b) => b.expiration - a.expiration)
    if (sortedList.length > 0) {
      return sortedList[0].expiration;
    } else {
      return null;
    }
  }

  ngOnDestroy(): void {
   if (this.sub) this.sub.unsubscribe();
   if (this.sub2) this.sub2.unsubscribe();
   if (this.sub3) this.sub3.unsubscribe();
  }
}
