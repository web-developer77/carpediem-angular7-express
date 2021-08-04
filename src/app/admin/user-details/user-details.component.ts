import { Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/user';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MatDialog } from '@angular/material';
import { PurchaseService } from 'src/app/shared/services/purchase.service';
import { BookingService } from 'src/app/shared/services/booking.service';
import { Booking } from 'src/app/shared/models/bookings';
import { Purchase } from 'src/app/shared/models/purchase';
import * as moment from 'moment';
import { NgForm } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AddUserClassComponent } from '../add-user-class/add-user-class.component';
import { AddUserCreditsComponent } from '../add-user-credits/add-user-credits.component';
import { ManageCreditsComponent } from '../manage-credits/manage-credits.component';
import { OpenPayService } from 'src/app/shared/services/openpay.service';
import PlansJson from '../../../assets/json/plans.json';
import { NGXLogger } from 'ngx-logger';
import { AddCardComponent } from '../../user/add-card/add-card.component';

declare var swal:any;
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
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
  user: User = new User ();
  // booking table variables
  bookingsCols: string[] = ['instructor', 'date', 'time', 'spot', 'actions'];
  bookingsData = new MatTableDataSource<Booking>();

  packages: Package [] = PlansJson;
  package: Package = {} as Package;

  // purchase table variables
  purchaseCols: string[] = ['package', 'date', 'card', 'amount ', 'expiration', 'actions'];
  purchaseData = new MatTableDataSource<Purchase>();

  // purchase table variables
  cardsCols: string[] = ['brand', 'card_number', 'actions'];
  cardsData = new MatTableDataSource<any>();

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();

  addClass: MatDialogRef<AddUserClassComponent>;
  addCredits: MatDialogRef<AddUserCreditsComponent>;
  manageCredits: MatDialogRef<ManageCreditsComponent>;

  sub: any;
  sub2: any;
  sub3: any;
  bookings: Booking[] = [];
  emergency_contact = false;
  injury = false;
  credit_cards: any[] = [];
  mails = true;
  file: File;
  fileUrl: string;
  loading = true;
  loading_tab = false;
  filter = 'incoming';
  sizes = [[36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47 , 48],
  [4, 5, 6, 7, 7.5, 8, 9, 10, 11, 11.5, 12, 13, 14],
  [23, 24, 24.5, 25, 25.5, 26, 27, 28, 28.5, 29, 30, 30.5, 31]];
  card = {
    card_number: null,
    holder_name: null,
    expiration_month: null,
    expiration_year: null,
    cvv2: null
  }

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private bookingService: BookingService,
    private purchaseService: PurchaseService,
    private http : HttpClient,
    private dialog: MatDialog,
    private openPayService: OpenPayService,
    private logger: NGXLogger
  ) { 
    this.route.paramMap.subscribe(paramMap => {
      // we get user if from url
      if (paramMap.has('key')) {
        // get user info from db
        this.userService.getUserByKey(paramMap.get('key')).subscribe(user => {
          this.user = user;
          this.user.born = moment(this.user.born, 'LL').toDate();
          // if we have a payment if (OpenPay 3Ds)
          this.route.queryParams.subscribe(params => {
            // we get the payment id
            if( params['id']){
              const id = params['id'];
              const payment = JSON.parse(localStorage.getItem('payment'));
              localStorage.removeItem('payment');
              // and get payment info from local storage
              this.openPayService.getTransaction(id).subscribe((res) => {
                // if payment was completed and double check the id
                if(res.status == 'completed'){
                  if (payment){
                    if(payment.id === id){
                      // we send email to client and add purchase
                      this.sendEmailPurchase(payment.package);
                      this.addPurchasessUser(payment.amount, payment.card.card_number, payment.package.name, payment.package.expiration).then(() =>{
                        // we save card if add_card flag
                        if(payment.add_card){
                          this.user.credit_cards.push(payment.card.id);
                        }
                        // save the cliet id, update credits (subscriptions cant handle 3Ds), update expiration, chage birthday to strig and save user
                        this.user.openPay_id = payment.customer_id;
                        this.user.credits += payment.package.classes;
                        this.user.plan_expiration = moment().add(payment.package.expiration, 'days').format('LL').toString();
                        this.user.born = moment(this.user.born).format('LL').toString();
                        this.userService.updateUser(this.user).then((res) =>{
                          swal({title:'El pago ha sido procesado exitosamente', text:'', type: ''})
                        });
                      });
                    }
                  }
                } else {
                  swal('Ocurrio un error con el pago', '', '');
                }
              });
            }
          });

          // we get confirmed or assisted bookings by user 
          this.sub2 = this.bookingService.getConfirmedBookingsByUser(user.$key).subscribe(bookings =>{
            this.bookings = bookings;
            this.filterIncoming();
            this.bookingsData.paginator =  this.paginator.toArray()[0];
            this.bookingsData.sort = this.sort.toArray()[0];
          });

          // we get the purcheses
          this.sub3 = this.purchaseService.getPurchaseByUser(user.$key).subscribe(purchases =>{
            this.purchaseData.data = purchases;
            this.purchaseData.paginator = this.paginator.toArray()[1];
            this.purchaseData.sort = this.sort.toArray()[1];
          });
          this.loading = false;
        });
      }
    });
  }

  ngOnInit() {

  }


  // function to update user from form
  updateUser(form: NgForm): void {
    // we must reconvert bron to string for db 
    this.user.born = moment(this.user.born).format('LL').toString();
    this.userService.updateUser(this.user).then(() =>{
      this.logger.info(`Admin-Actualizar-Usuario ${this.user.$key}, ${this.user.name}, ${this.user.email}`);
      swal('Los datos fueron actualizados', '', '')
    })
  }

  // function to open a new booking modal
  openBook(): void{
    this.dialog.open(AddUserClassComponent, {
      width: '95vw',
      height: '95vh',
      data: { id:  this.user.$key },
    });
  }

  openManageCredits(): void{
    this.dialog.open(ManageCreditsComponent, {
      width: '95vw',
      height: '95vh',
      data: { id:  this.user.$key },
    });
  }

  // function to open new paymeent modal
  openBuy(): void{
    this.dialog.open(AddUserCreditsComponent, {
      width: '95vw',
      height: '95vh',
      data: { id:  this.user.$key },
    });
  }

  // function to add users photo
  addFile(f): void {
    this.loading = true;
    const file = this.userService.addFile(f[0], Math.floor((Math.random() * 999999999) + 1).toString())
    file.task.snapshotChanges().pipe(
      finalize(() => {
        file.ref.getDownloadURL().subscribe(url => {
          this.fileUrl =  url;
          this.loading = false;
        });
      })).subscribe();
  }

  // function to send email to a user
  sendMail(){
    swal({
      title: 'Escribe tu mensaje al usuario',
      text: ``,
      input: 'textarea',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar'
    }).then((message) => {
      if(message){
        const email = {
          to: this.user.email,
          from: 'hola@carpe-diem.mx',
          template: 3,
          data: message
        }
        this.http.post('/sendEmailT', email).subscribe(res =>{
          swal('El email ha sido enviado', '', '')
        }, error =>{
          console.log(error);
        });
      }
    }).catch(swal.noop);
  }

  // function to create purchass object in case of 3Ds payment
  addPurchasessUser(price: number, card_number: string, name: string, expiration: string): Promise<any>{
    const purchase_object: Purchase = {
      user: this.user.$key,
      amount: price,
      package:  name,
      subscription: false,
      date: moment().format('l'),
      expirationObj: moment().add(this.package.expiration, 'days').toDate(),
      expiration: moment().add(expiration, 'days').format('LL').toString(),
      card: card_number
    };
    this.user.plan = this.package.name;
    if(this.package.subscription){
      this.user.subscription_count++; 
      purchase_object.subscription_count = this.user.subscription_count;
    } else {
      this.user.subscription_count = 0;
    }
    return this.purchaseService.createPurchase(purchase_object);
  }

   // functiont to send purchase emial to user
   sendEmailPurchase(purchase: any): void {
    const email   = {
      to: this.user.email,
      from: 'hola@carpe-diem.mx',
      template: 2,
      data: `<Paquete: ${purchase.name} \n 
            <Precio: ${purchase.price} \n 
            <Expiración: ${purchase.expiration} \n`
    }
    this.http.post('/sendEmailT', email).subscribe(res =>{
      console.log(res)
    }, error =>{
      console.log(error);
    });
  };

  // function to show only incoming bookings
  filterIncoming(): void {
    this.filter = 'incoming';
    this.bookingsData.data = this.bookings.filter(booking =>  moment(booking.date, 'LL').isSameOrAfter(moment(), 'day'))
  }

  // function to show only previous bookings
  filterPrevious(): void {
    this.filter = 'previous';
    this.bookingsData.data = this.bookings.filter(booking =>  moment(booking.date, 'LL').isBefore(moment(), 'day'))
    this.bookingsData.data.reverse();
  }


  // function to save updated user credits
  save(){
    this.user.born = moment(this.user.born).format('LL').toString();
    this.userService.updateUser(this.user).then(() =>{
      this.logger.info(`Admin-Actualizar-Creditos-Usuario ${this.user.$key}, ${this.user.name}, ${this.user.email}`);
      swal('Los créditos fueron actualizados', '', '')
    })
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
      title: `¿Deseas cancelar la reservación con ${booking.instructor.name}?`,
      text: lateCancel ? 'La cancelación es con menos de 12 horas de anticipación, su crédito no sera devuelto': '',
      type: "",
      showCancelButton: true,
      confirmButtonClass: "btn-danger",
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
    }).then(() => {
      // we change status of the booking change date to string to save it in db
      let returned = false;
      booking.status = 'canceled';
      booking.lateCancel = lateCancel;
      this.user.born = moment(this.user.born).format('LL').toString();
      if ((!this.user.subscription || this.user.plan_id === 6) && !lateCancel){
        this.user.credits++;
        returned = true;
      }

      this.bookingService.updateBookingUser(booking, this.user).then(() => {
        swal('LA reservación fue cancelada', '', '');
        this.logger.info(`Admin-Cancelar-Reservacion, usuario ${this.user.name} ${this.user.last_name}, late? ${lateCancel}, bici ${booking.spot}, clase ${booking.sub_class}, credits returned: ${returned}`);
      }, err =>{
        console.log(err)
      })
    }).catch(swal.noop);
  }

  // function to delete a pruchase
  cancelPurchase(purchase: Purchase): void {
    swal({
      title: '¿Estás seguro que deseas cancelar esta compra?',
      text: "Al usario se les borrarán los créditos y las membresías serán canceladas",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI',
      cancelButtonText: 'NO, REGRESAR'
    }).then(() => {
      // find the package by its name
      this.package = this.packages[this.packages.findIndex(p => p.name === purchase.package)];
      // if found we check if subscrpction or credits
      if(this.package.id){
        if(this.package.subscription){
          this.user.subscription = false;
          this.user.plan = '';
          this.user.plan_id = -1;
          this.user.credits = 0;
        } else {
          this.user.credits -= this.package.classes;
          if (this.user.credits < 0) this.user.credits = 0;
        }
        this.user.plan_expiration = moment().subtract(1, 'days').format('LL').toString();
        this.user.born = moment(this.user.born).format('LL').toString();
        // update user and delete purchase record
        this.userService.updateUser(this.user).then(() =>{
          this.purchaseService.deletePurchase(purchase.$key).then(() =>{
          this.logger.info(`Admin-Borrar-Compra-Usuario, usuario ${this.user.$key}, compra paquete ${purchase.package} cantidad ${purchase.amount}, tarjeta ${purchase.card}`);
            swal('La compra fue borrada exitosamente', '', '');
          });
        }) 
      } else {
        swal('Ocurrio un error', '', '')
      }
    }).catch(swal.noop);
  }

  getCards(tab){
    // if he has an openPay id we can reterive his credit cards
    if (this.user.openPay_id && tab === 2 && !this.credit_cards.length) {
      this.loading_tab = true;
      const cardQueries: Observable<any>[] = [];
      this.user.credit_cards.forEach(card => {
        cardQueries.push(this.openPayService.getClientCard(card, this.user.openPay_id).pipe(take(1)));
      })
      if (cardQueries.length > 0){
        forkJoin(cardQueries).subscribe(cards => {
          cards.map((card) => card.brand === 'american_express' ? card.brand = 'american' : card.brand)
          this.credit_cards = cards;
          this.cardsData.data = cards;
          this.loading_tab = false;
        });
      } else {
        this.loading_tab = false;
      }
    } else {
      this.loading_tab = false;
    }
  }

  //open modal
  addCard(){
    const dialogRef =this.dialog.open(AddCardComponent, {
      data: { id:  this.user.$key },
    });

    //reload cards on modal close
    dialogRef.afterClosed().subscribe(() => {
      this.updateCardsInfo();
    });
  }

  //trigger cards reaload
  updateCardsInfo(){
    this.credit_cards = [];
    this.getCards(2);
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
            this.logger.info(`Admin-Borrar-Tarjeta, usuario ${this.user.name} ${this.user.last_name}, tarjeta ${card.id}`);
            swal('La tarjeta fue eliminada', '', '')
            this.updateCardsInfo();
          })
        }
      });
    }).catch(swal.noop);
  }

  // Function to cancel a plan renovation in OpenPay
  cancelRenovation(){
    swal({
      title: `¿Quieres cancelar la renovación del plan`,
      text: 'El usuario podra seguir utilizando su plan hasta su expiración',
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
            swal('La renovación de la subscripción ha sido cancelada', '', '')
            this.logger.info(`Admin-Cancelar-Plan, usuario ${this.user.name} ${this.user.last_name}, Plan ${this.user.open_plan}, Id_open ${this.user.open_plan}`);
          })
        }
      });
    }).catch(swal.noop);
  }

  changeEx(e){
    this.user.plan_expiration = moment(e.target.value).format('LL').toString();
  }
  saveExpiration(){
    this.user.born = moment(this.user.born).format('LL').toString();
    this.userService.updateUser(this.user).then(() => {
      this.logger.info(`Admin-ExpiraciónCreditosActualizados, usuario ${this.user.name} ${this.user.last_name}, expi ${this.user.plan_expiration}`);
      swal('La fecha de vigencia fue actualizada', '', '')
    })
  }

  ngOnDestroy(): void {
    this.sub2.unsubscribe();
    this.sub3.unsubscribe();
   }
}
