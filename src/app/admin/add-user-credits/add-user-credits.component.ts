import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user';
import { take } from 'rxjs/operators';
import { payment } from 'src/app/shared/models/payment';
import PlansJson from '../../../assets/json/plans.json';
import { OpenPayService } from 'src/app/shared/services/openpay.service.js';
import { PurchaseService } from 'src/app/shared/services/purchase.service.js';
import { HttpClient } from '@angular/common/http';
import * as  moment from 'moment';
import { Observable, forkJoin } from 'rxjs';
import { NgForm } from '@angular/forms';
import { Purchase } from 'src/app/shared/models/purchase.js';
import { NGXLogger } from 'ngx-logger';


declare var swal: any;

interface Package {
  id: number;
  subscription: boolean;
  name: string;
  price: number;
  subscription_id?: string;
  classes?: number;
  expiration: number;
}

@Component({
  selector: 'app-add-user-credits',
  templateUrl: './add-user-credits.component.html',
  styleUrls: ['./add-user-credits.component.scss']
})
export class AddUserCreditsComponent implements OnInit {
  loadingUser = true;
  loading = false;
  payment: payment = {} as payment;
  step: boolean[] = [true, false];
  user: User;
  packages: Package[] = PlansJson;
  package: Package = {} as Package;
  //planes [mes limitado, mes ilimitado, año ilimitado]
  plans: string[] = ['peqx2aka7wdzdqyvglmq', 'p5faagqecvb1eogn1491', 'pa8ivcvsuv7dy2zpbxon']
  credit_card: string;
  credit_cards = [];
  disccount = 0;
  new_card = false;
  url_redirect: string;
  special_payment = '';
  show_modal = false;
  id: number;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private openPayService: OpenPayService,
    private purchaseService: PurchaseService,
    private http: HttpClient,
    private logger: NGXLogger
  ) {
    moment().locale('es');
    this.userService.getUserByKey(data.id).pipe(take(1)).subscribe(user => {
      this.user = user;
      this.url_redirect = `${window.location.origin}/admin/user/${user.$key}`;
      this.credit_card = user.credit_cards[0];
      const cardQueries: Observable<any>[] = [];
      this.user.credit_cards.forEach(card => {
        cardQueries.push(this.openPayService.getClientCard(card, this.user.openPay_id).pipe(take(1)));
      })
      if (cardQueries.length > 0) {
        forkJoin(cardQueries).subscribe(cards => {
          cards.map((card) => card.brand == 'american_express' ? card.brand = 'american' : card.brand)
          this.credit_cards = cards;
          this.loadingUser = false;
        });
      } else {
        this.loadingUser = false;
        this.new_card = true;
      }
    });
  }

  ngOnInit() {
  }
  checkPlan(id: number): boolean {
    // User is new adn trying to buy first class  
    if (id === 0 && !this.user.new) {
      swal('Ya has utilizado este beneficio', 'Puedes comprar cualquier otro plan', '');
      return false;
    }

    //User has a classes package
    if (!this.user.subscription && this.packages[id].subscription && this.user.credits > 0) {
      swal('¡Tienes un paquete de clases! ', 'Necesitas terminar tus clases para poder suscribirte a una membresía', '');
      return false;
    }

    // User has a subscription
    if (this.user.subscription && this.user.plan_id !== 6 && !this.packages[id].subscription && moment(this.user.plan_expiration, 'LL').toDate() > moment().toDate()) {
      swal('¡Tienes una membresía!', 'Necesitas cancelar tu membresía y esperar a que venza la suscripción para comprar un paquete de clases', '');
      return false;
    }

    return true;
  }

  // after plan select check if user is registrated in OpenPay
  selectPlan(id: number): void {
    this.show_modal = true;
    this.id = id;
  }

  special() {
    this.show_modal = false;
    if (this.checkPlan(this.id)) {
      if (this.special_payment) {
        this.addPackage();
      } else {
        this.package = this.packages[this.id];
        this.step[0] = false;
        this.step[1] = true;
      }
    }
  }

  // fucction to process packages in caso of couresty or cash payment
  addPackage(): void {
    this.package = this.packages[this.id];
    this.user.new = false;
    console.log("adding package...");
    if (this.package.subscription) {
      this.user.subscription = true;
      this.user.plan = this.package.name;
      this.user.plan_id = this.package.id;
    } else {
      this.user.plan = this.package.name;
      this.user.subscription = false;
    }
    console.log("user->", this.user)
    this.addCreditsExpiration();
    this.addPurchasessUser(this.special_payment === 'Cortesía' ? 0 : this.package.price, this.special_payment);
  }

  paymentForm(form: NgForm): void {
    if (form.valid) {
      this.loading = true;
      // if user is adding a new card or the first card
      if (this.new_card) {
        this.payment.card_number = this.payment.card_number.replace(/ /g, '');
        if (!this.openPayService.validate(this.payment)) {
          this.loading = false;
          return;
        }
        // if user already registered in open pay
        if (this.user.openPay_id) {
          // check if subscription or credits adding new card
          this.package.subscription ? this.addCardPlan() : this.addCardPay()
        } else {
          // check if subscription or credits  and  register user 
          this.package.subscription ? this.createSubscription() : this.createNewPayment()
        }
        // if user is not adding a new card, must be registered in open pay, just check if subscription or credits
      } else {
        this.package.subscription ? this.addPlan() : this.sendPayment()
      }
    }
  }


  // add Plan to existing client
  addPlan(): void {
    this.openPayService.addPlan(this.credit_card, this.user.openPay_id, this.package.subscription_id, false).pipe(take(1)).subscribe(res => {
      if (res.error_code) {
        swal({ title: 'Ocurrio un error', text: 'Porfavor verifica tu informacion he intentalo nuevamente', type: '' });
        this.loading = false;
      } else if (res.status === 'active') {
        this.sendEmail();
        this.user.subscription = true;
        this.user.plan = this.package.name;
        this.user.plan_id = this.package.id;
        this.user.open_plan = res.id;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.transaction.amount, res.card.card_number);
      }
    });
  }

  // function to process payment for existing user
  sendPayment(): void {
    this.openPayService.sendPayment(this.credit_card, this.user.openPay_id, this.package.price - this.disccount, this.url_redirect, false, this.package.name).pipe(take(1)).subscribe((res) => {
      if (res.error_code) {
        this.loading = false;
        swal({ title: 'Ocurrio un error', text: 'Porfavor verifica tu informacion he intentalo nuevamente', type: '' })
      } else if (res.status == 'charge_pending') {
        res.add_card = false;
        res.package = this.package;
        localStorage.setItem('payment', JSON.stringify(res));
        location.replace(res.payment_method.url)
      } else if (res.status === 'completed') {
        this.user.new = false;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.amount, res.card.card_number);
      }
    });
  }

  // function to create  subsciption  to a new user
  createSubscription(): void {
    this.openPayService.createSubscription(this.payment, this.user, this.package.subscription_id).pipe(take(1)).subscribe((res) => {
      if (res.error_code) {
        swal({ title: 'Ocurrio un error', text: 'Porfavor verifica tu informacion he intentalo nuevamente', type: '' });
        this.loading = false;
      } else if (res.status === 'active') {
        this.user.openPay_id = res.customer_id;
        this.user.plan_id = this.package.id;
        this.user.open_plan = res.id;
        this.user.plan = this.package.name;
        this.user.subscription = true;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.transaction.amount, res.card.card_number);
      }
    })
  }

  // create a new user and card in open pay
  createNewPayment(): void {
    this.openPayService.createPayment(this.payment, this.user, this.package.price - this.disccount, this.url_redirect, this.package.name).pipe(take(1)).subscribe((res: any) => {
      if (res.error_code) {
        this.loading = false;
        swal({ title: 'Ocurrio un error', text: 'Porfavor verifica tu informacion he intentalo nuevamente', type: '' })
      } else if (res.status == 'charge_pending') {
        res.add_card = true;
        res.package = this.package;
        localStorage.setItem('payment', JSON.stringify(res));
        location.replace(res.payment_method.url)
      } else if (res.status === 'completed') {
        this.user.credit_cards.push(res.card.id);
        this.user.new = false;
        this.user.plan = this.package.name;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.amount, res.card.card_number);
      }
    });
  }

  // function to add a new card and pay
  addCardPay() {
    this.openPayService.addCardPay(this.payment, this.user.openPay_id, this.package.price - this.disccount, this.url_redirect, this.package.name).pipe(take(1)).subscribe(res => {
      if (res.error_code) {
        swal({ title: 'Ocurrio un error', text: 'Porfavor verifica tu informacion he intentalo nuevamente', type: '' });
        this.loading = false;
      } else if (res.status == 'charge_pending') {
        res.package = this.package;
        res.add_card = true;
        localStorage.setItem('payment', JSON.stringify(res));
        location.replace(res.payment_method.url)
      } else if (res.status === 'completed') {
        this.user.credit_cards.push(res.card.id);
        this.user.new = false;
        this.user.plan = this.package.name;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.amount, res.card.card_number);
      }
    });
  }

  // function to add a new card and subscribe
  addCardPlan() {
    this.openPayService.addCardPlan(this.payment, this.user.openPay_id, this.package.subscription_id).pipe(take(1)).subscribe((res) => {
      if (res.error_code) {
        swal({ title: 'Ocurrio un error', text: 'Porfavor verifica tu informacion he intentalo nuevamente', type: '' });
        this.loading = false;
      } else if (res.status === 'active') {
        this.user.plan = this.package.name;
        this.user.plan_id = this.package.id;
        this.user.open_plan = res.id;
        this.user.openPay_id = res.customer_id;
        this.user.credit_cards.push(res.card.id);
        this.user.subscription = true;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.transaction.amount, res.card.card_number);
      }
    });
  }

  // function to add credits and expitarion
  addCreditsExpiration(): void {
    // if package is credits
    if (this.package.id == 6) {
      this.user.credits = 20;
    }
    else if (this.package.id < 6) {
      // if credits have not expired
      if (moment(this.user.plan_expiration, 'LL').isAfter(moment())) {
        this.user.credits += this.package.classes;
      } else {
        // we add the credtits to expired credits before erasing them
        this.logger.info(`Creditos expirados2, ${this.user} ${this.user.name}, creditos: ${this.user.credits}, fecha ${this.user.plan_expiration}`)
        this.user.expired_credits = this.user.expired_credits ? this.user.expired_credits + this.user.credits : this.user.credits;
        this.user.credits = this.package.classes;
      }
    }
    // if new expiration is after current expiration
    if (moment(this.user.plan_expiration, 'LL').isBefore(moment().add(this.package.expiration, 'days'))) {
      this.user.plan_expiration = moment().add(this.package.expiration, 'days').format('LL').toString();
    }
  }

  addPurchasessUser(price: number, card_number: string): void {
    // create purchase object
    let purchase_object: Purchase = {
      user: this.user.$key,
      amount: price,
      subscription: this.package.subscription,
      package: this.package.name,
      date: moment().format('l'),
      expiration: moment().add(this.package.expiration, 'days').format('LL').toString(),
      expirationObj: moment().add(this.package.expiration, 'days').toDate(),
      card: card_number
    };
    if (this.package.subscription) {
      this.user.subscription_count++;
      purchase_object.subscription_count = this.user.subscription_count;
    } else {
      this.user.subscription_count = 0;
    }
    // crete it and update user in batch
    this.purchaseService.createPurchaseUpdateUser(purchase_object, this.user).then(() => {
      this.sendEmail();
      this.loading = false;
      let message = 'La compra fue porcesada exitosamemte';
      if (this.special_payment) {
        message = this.special_payment === 'Cortesía' ? 'La cortesía fue porcesada exitosamemte' : 'El pago en mostrador fue porcesado exitosamemte';
      }
      swal(message, '', '')
      this.logger.info(`Admin-Agregar-UsuarioCompra, usuario ${this.user.$key}, package${this.package.name}, forma-pago ${card_number}, amount ${price}, special: ${this.special_payment}`)
    }).catch((err) => {
      console.log(err);
    });
  }

  sendEmail(): void {
    const email = {
      to: this.user.email,
      from: 'hola@carpe-diem.mx',
      template: 2,
      data: `<Paquete: ${this.package.name} \n 
            <Precio: ${this.package.price} \n 
            <Expiración: ${this.package.expiration} \n`
    }
    this.http.post('/sendEmailT', email).subscribe(res => {
      console.log(res)
    }, error => {
      console.log(error);
    });
  };
}
