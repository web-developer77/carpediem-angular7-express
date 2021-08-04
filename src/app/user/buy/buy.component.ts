import { Component, OnInit } from '@angular/core';
import { payment } from 'src/app/shared/models/payment';
import { OpenPayService } from 'src/app/shared/services/openpay.service';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/models/user';
import PlansJson from '../../../assets/json/plans.json';
import { UserService } from '../../shared/services/user.service';
import * as  moment from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators'
import { Purchase } from '../../shared/models/purchase';
import { PurchaseService } from '../../shared/services/purchase.service';
import { Observable, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DiscountService } from '../../shared/services/discount.service';
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
  selector: 'app-buy',
  templateUrl: './buy.component.html',
  styleUrls: ['./buy.component.scss']
})
export class BuyComponent implements OnInit {
  loadingUser = true;
  loading = false;
  payment: payment = {} as payment;
  step: boolean[] = [true, false];
  user: User;
  packages: Package[] = PlansJson;
  package: Package = {} as Package;
  credit_card: string;
  credit_cards = [];
  discount_code = '';
  discount = 0;
  apply_discount = false;
  new_card = false;
  url_redirect: string;
  errorsCatalog = {
    _3001: 'La tarjeta ha sido rechazada. Contacte a su banco.',
    _3002: 'La tarjeta ha expirado. Por favor intente con otra tarjeta.',
    _3003: 'La tarjeta no tiene fondos suficientes. Por favor intente con otra tarjeta.',
    _3004: 'La tarjeta tiene un reporte de robo, se notificará el intento de transacción.',
    _3005: 'La tarjeta ha sido rechazada por el sistema antifraudes. Contacte a su banco.',
    _3006: 'Esta operación no es válida para este cliente o transacción. Contacte a su banco.',
    _3007: 'Su tarjeta no es válida. Por favor intente con otra tarjeta.',
    _3008: 'Su tarjeta no soporta transacciones en línea. Intente con otra tarjeta.',
    _3009: 'La tarjeta tiene un reporte de extravío. Contacte a su banco',
    _3010: 'La tarjeta tiene una restricción de su banco. Contacte a su banco.',
    _3011: 'El banco ha solicitado se retenga esta tarjeta. Contacte a su banco.',
    _3012: 'Necesita autorización del banco para realizar esta transacción. Contacte a su banco',
  }

  constructor(
    private openPayService: OpenPayService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private http: HttpClient,
    private discountService: DiscountService,
    private logger: NGXLogger
  ) {
    moment().locale('es');
    this.userService.getUserByKey(this.authService.getLoggedInUser().$key).pipe(take(1)).subscribe((user) => {
      if (user) {
        this.user = user;
        if (user.credit_cards && user.credit_cards.length > 0) {
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
          }
        } else {
          this.loadingUser = false;
          this.new_card = true;
        }
        this.route.paramMap.subscribe(paramMap => {
          if (paramMap.has('id')) {
            if (this.checkPlan(parseInt(paramMap.get('id')))) {
              this.package = this.packages[paramMap.get('id')];
              this.step[0] = false;
              this.step[1] = true;
            }
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    })
  }

  ngOnInit() {
    this.url_redirect = `${window.location.origin}/carpe/book/`;
  }

  checkPlan(id: number): boolean {
    console.log("here right?");
    // User is admin
    if (this.user.admin) {
      swal('El admin solo puede comprar clases en en panel', '', '');
      return false;
    }

    //  temp for virtual clases 
    // if (id == 9) {
    //   return true
    // }

    // if( id !== 0 && this.user.new){
    //   swal('¡Debes comprar tu clase de prueba por ser tu primera vez!', '', '');
    //   return false;
    // }

    // if(this.user.assistances == 0 && moment(this.user.plan_expiration, 'LL').isAfter(moment())){
    //  swal('¡Debes asistir a tu clase de prueba para continuar comprando!', '', '');
    //  return false;
    // }
    // User used the first class

    if (id === 0) {
      if (this.user.plan) {
        swal('Ya has utilizado este beneficio', 'Puedes comprar cualquier otro plan', '');
      } else {
        return true;
      }
      return false;
    }
    // if (id === 0 && this.user.new === false) {
    //   swal('Ya has utilizado este beneficio', 'Puedes comprar cualquier otro plan', '');
    //   return false;
    // }

    //User has a classes package
    if (!this.user.subscription && this.packages[id].subscription && this.user.credits > 0) {
      swal('¡Tienes un paquete de clases! ', 'Necesitas terminar tus clases para poder suscribirte a una membresía', '');
      return false;
    }

    // User has a subscription
    if (this.user.subscription && this.user.plan_id !== 6 && this.user.plan_id !== 9 && !this.packages[id].subscription && moment(this.user.plan_expiration, 'LL').toDate() > moment().toDate()) {
      swal('¡Tienes una membresía!', 'Necesitas cancelar tu membresía y esperar a que venza la suscripción para comprar un paquete de clases', '');
      return false;
    }
    if (this.user.subscription) {
      if (this.user.plan_id == 9) {
        if (id == 9) {
          swal('¡Tienes la misma membresía! ', 'No puedes reservar la misma membresía', '');
          this.router.navigate(['/carpe/home']);
          return false;
        }
      } else {
        if (id != 9) {
          swal('¡Tienes la misma membresía! ', 'No puedes reservar la misma membresía', '');
          this.router.navigate(['/carpe/home']);
          return false;
        }
      }
    }
    return true;
  }

  // after plan select check if user is registrated in OpenPay
  selectPlan(id: number): void {
    if (this.checkPlan(id)) {
      this.package = this.packages[id];
      this.step[0] = false;
      this.step[1] = true;
    } else {
      this.router.navigate(['/carpe/home']);
    }
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
      if (res.error_code || (res.data && res.data.error_code)) {
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : (res.description || res.data.description), text: '', type: '' })
        this.loading = false;
      } else if (res.status === 'active') {
        this.user.subscription = true;
        this.user.plan_id = this.package.id;
        this.user.open_plan = res.id;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.transaction.amount, res.card.card_number);
      }
    });
  }

  // function to process payment for existing user
  sendPayment(): void {
    if (this.apply_discount) {
      this.package.price = 100;
    }
    this.openPayService.sendPayment(this.credit_card, this.user.openPay_id, this.package.price - this.discount, this.url_redirect, false, this.package.name).pipe(take(1)).subscribe((res) => {
      console.log("res->", res)
      if (res.error_code || (res.data && res.data.error_code)) {
        this.loading = false;
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : (res.description || res.data.description), text: '', type: '' })
      } else if (res.status === 'charge_pending') {
        res.add_card = false;
        res.package = this.package;
        localStorage.setItem('payment', JSON.stringify(res));
        location.replace(res.payment_method.url)
        this.loading = false;
      } else if (res.status === 'completed') {
        this.user.new = false;
        this.user.openPay_id = res.customer_id;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.amount, res.card.card_number)
      }
    });
  }

  // function to create  subsciption  to a new user
  createSubscription(): void {
    this.openPayService.createSubscription(this.payment, this.user, this.package.subscription_id).pipe(take(1)).subscribe((res) => {
      if (res.error_code || (res.data && res.data.error_code)) {
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : (res.description || res.data.description), text: '', type: '' })
        this.loading = false;
      } else if (res.status === 'active') {
        this.user.openPay_id = res.customer_id;
        this.user.plan_id = this.package.id;
        this.user.open_plan = res.id;
        this.user.credit_cards.push(res.card.id);
        this.addCreditsExpiration();
        this.user.subscription = true;
        this.addPurchasessUser(res.transaction.amount, res.card.card_number);
      }
    })
  }

  // create a new user and card in open pay
  createNewPayment(): void {
    this.openPayService.createPayment(this.payment, this.user, this.package.price - this.discount, this.url_redirect, this.package.name).pipe(take(1)).subscribe((res: any) => {
      if (res.error_code || (res.data && res.data.error_code)) {
        this.loading = false;
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : (res.description || res.data.description), text: '', type: '' })
      } else if (res.status == 'charge_pending') {
        res.add_card = true;
        res.package = this.package;
        localStorage.setItem('payment', JSON.stringify(res));
        location.replace(res.payment_method.url)
      } else if (res.status === 'completed') {
        this.user.openPay_id = res.customer_id;
        this.user.credit_cards.push(res.card.id);
        this.user.new = false;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.amount, res.card.card_number);
      }
    });
  }

  // function to add a new card and pay
  addCardPay() {
    this.openPayService.addCardPay(this.payment, this.user.openPay_id, this.package.price - this.discount, this.url_redirect, this.package.name).pipe(take(1)).subscribe(res => {
      if (res.error_code || (res.data && res.data.error_code)) {
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : (res.description || res.data.description), text: '', type: '' })
        this.loading = false;
      } else if (res.status === 'charge_pending') {
        res.package = this.package;
        res.add_card = true;
        localStorage.setItem('payment', JSON.stringify(res));
        location.replace(res.payment_method.url)
      } else if (res.status === 'completed') {
        this.user.openPay_id = res.customer_id;
        this.user.credit_cards.push(res.card.id);
        this.user.new = false;
        this.addCreditsExpiration();
        this.addPurchasessUser(res.amount, res.card.card_number);
      }
    });
  }

  // function to add a new card and subscribe
  addCardPlan() {
    this.openPayService.addCardPlan(this.payment, this.user.openPay_id, this.package.subscription_id).pipe(take(1)).subscribe((res) => {
      if (res.error_code || (res.data && res.data.error_code)) {
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : (res.description || res.data.description), text: '', type: '' })
        this.loading = false;
      } else if (res.status === 'active') {
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

  addPurchasessUser(price: number, card_number: string) {
    // create purchase object
    const purchase_object: Purchase = {
      user: this.user.$key,
      amount: price,
      package: this.package.name,
      subscription: this.package.subscription,
      date: moment().format('l'),
      expiration: moment().add(this.package.expiration, 'days').format('LL').toString(),
      expirationObj: moment().add(this.package.expiration, 'days').toDate(),
      card: card_number
    };
    this.user.plan = this.package.name;
    if (this.package.subscription) {
      this.user.subscription_count++;
      this.user.subscription = true;
      this.user.plan_id = this.package.id;
      purchase_object.subscription_count = this.user.subscription_count;
    } else {
      this.user.subscription_count = 0;
    }
    // crete it and update user in batch
    this.purchaseService.createPurchaseUpdateUser(purchase_object, this.user).then(() => {
      if (this.package.id != 9) {
        this.sendEmail();
      } else {
        this.sendEmailVirtual();
      }
      this.authService.SetLocal(this.user);
      this.loading = false;
      swal({ title: 'Tu pago ha sido procesado exitosamente', text: '', type: '' }).then(() => {
        this.router.navigate(['/carpe/book']);
      });
      this.logger.info(`User-Agregar-UsuarioCompra, usuario ${this.user.$key}, package${this.package.name}, forma-pago ${card_number}, amount ${price}`)
    });
  }

  // function to add credits and expitarion
  addCreditsExpiration(): void {
    // if package is credits
    if (this.package.id == 6) {
      this.user.credits = 20;
      this.user.subscription_count++;
    }
    else if (this.package.id < 6) {
      this.user.subscription_count = 0;
      // if credits have not expired
      if (moment(this.user.plan_expiration, 'LL').isAfter(moment())) {
        this.user.credits += this.package.classes;
      } else {
        // we add the credtits to expired credits before erasing them
        this.logger.info(`Creditos expirados, ${this.user} ${this.user.name}, creditos: ${this.user.credits}, fecha ${this.user.plan_expiration}`)
        this.user.expired_credits = this.user.expired_credits ? this.user.expired_credits + this.user.credits : this.user.credits;
        this.user.credits = this.package.classes;
      }
    }
    // if new expiration is after current expiration

    if (!this.user.plan_expiration || moment(this.user.plan_expiration, 'LL').isBefore(moment().add(this.package.expiration, 'days'))) {
      this.user.plan_expiration = moment().add(this.package.expiration, 'days').format('LL').toString();
    }

  }

  applayDiscount() {
    this.discountService.getDiscountByCode(this.discount_code).subscribe(discount => {
      if (discount.length > 0) {
        if (this.apply_discount === false) {
          this.package.price = this.package.price * (1 - discount[0].percentage);
          this.apply_discount = true;
        }
        console.log("price->", this.package.price)
        swal('El código fue aplicado correctamente', '', '');
      } else {
        swal('No se encontró el código', '', '');
      }
    })
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


  sendEmailVirtual(): void {
    const email = {
      to: 'hola@carpe-diem.mx',
      from: 'contact@carpe-diem.mx',
      template: 3,
      data: `
      El usuario ${this.user.name} ${this.user.last_name} ha comprado el paquete de clases virtuales ilimitadas, \n
      su paquete expira el ${this.user.plan_expiration} \n`
    }
    this.http.post('/sendEmailT', email).subscribe(res => {
      console.log(res)
    }, error => {
      console.log(error);
    });
  };



}




