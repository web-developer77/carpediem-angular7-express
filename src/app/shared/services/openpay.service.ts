import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { payment, payment_request } from '../models/payment';
import { AuthService } from './auth.service';
import { User } from '../models/user';
import { Observable, observable} from 'rxjs';
import { map, switchMap, share } from 'rxjs/operators';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';

declare var OpenPay: any;
declare var swal: any;

@Injectable({
  providedIn: 'root'
})
export class OpenPayService {
  message: string;
  deviceSessionId :string;
  token: string;
  user: User;
  apiHost
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
    _3012: 'Necesita autorización del banco para realizar esta transacción. Contacte a su banco'
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {
    OpenPay.setId(environment.openPay.id);
    ​OpenPay.setApiKey(environment.openPay.apiKey);
    OpenPay.setSandboxMode(!environment.production);
    this.deviceSessionId = OpenPay.deviceData.setup();
    this.user = this.authService.getLoggedInUser();

    this.apiHost = !environment.production && window.location.search.indexOf('e2e=true') > -1 ? 'https://stage.carpe-diem.mx' : ''
  }

  // Function to create openpay client add card and send payment
  createPayment(payment: payment, user: User, ammount: number, redirect_url: string, description: string): Observable<any>{
    return this.createClient(user).pipe(switchMap(client =>
      this.createToken(payment, client))).pipe(switchMap((res:any) => {
        if (!res.client_id) return new Observable(observable => {
          observable.next(res)
          observable.complete()
        })
        return this.addCardClient(res.token_id, res.client_id).pipe(switchMap((res:any) => {
          if (res.error_code) return new Observable(observable => {
            observable.next(res)
            observable.complete()
          })
          return this.sendPayment(res.card, res.client, ammount, redirect_url, res.customerId, description)
        }))
      }))
  }

    // Function to create openpay client add card and subscription
  createSubscription(payment: payment, user: User, plan: string): Observable<any>{
      return this.createClient(user).pipe(switchMap(client =>
        this.createToken(payment, client))).pipe(switchMap((res:any) => {
          return this.addCardClient(res.token_id, res.client_id).pipe(switchMap((res:any) => {
            if (res.error_code) return new Observable(observable => {
              observable.next(res)
              observable.complete()
            })
            return this.addPlan(res.card, res.client, plan, res.customerId)
          }));
        }))
  }

    // Function to create openpay client add card 
  createUserCard(card, user: User): Observable<any> {
    return this.createClient(user).pipe(switchMap(client =>
      this.createToken(card, client))).pipe(switchMap((res:any) => {
        if (!res.client_id) return new Observable(observable => {
          observable.next(res)
          observable.complete()
        })
        return this.addCardClient(res.token_id, res.client_id).pipe()
      }))
  }

    // Function to add card to  openpay client  and send payment
  addCardPay(payment: payment, openPay_id: string, ammount: number, redirect_url: string, description: string): Observable<any>{
    return this.createToken(payment, openPay_id).pipe(switchMap((res:any) => {
      if (!res.client_id) return new Observable(observable => {
        observable.next(res)
        observable.complete()
      })
      return this.addCardClient(res.token_id, res.client_id).pipe(switchMap((res:any) => {
        if (res.error_code) return new Observable(observable => {
          observable.next(res)
          observable.complete()
        })
        return this.sendPayment(res.card, res.client, ammount, redirect_url, res.customerId, description)
      }))
    }))
  }

    // Function to add card to  openpay client  and subscription
  addCardPlan(payment: payment, openPay_id: string, plan: string): Observable<any>{
    return this.createToken(payment, openPay_id).pipe(switchMap((res:any) => {
      if (!res.client_id) return new Observable(observable => {
        observable.next(res)
        observable.complete()
      })
      return  this.addCardClient(res.token_id, res.client_id).pipe(switchMap((res:any) => {
        if (res.error_code) return new Observable(observable => {
          observable.next(res)
          observable.complete()
        })
        return this.addPlan(res.card, res.client, plan, res.customerId)
      }))
    }))
  }


  createClient(user: User): Observable<any> {
    const customerRequest = {
      'name': user.name,
      'email': user.email,
      'phone_number': parseInt(user.phone, 10),
      'requires_account': false
      };
    return this.http.post(this.apiHost ? this.apiHost + '/createCustomer' : '/createCustomer', customerRequest).pipe(map(
      (res: any) => {
        if(res.error_code){
          const errorLabel = this.errorsCatalog['_' + res.error_code]
          swal({ title: errorLabel ? errorLabel : res.description, text: '', type: '' })
          return res;
        } else{
          return res.id as string;
        }
      })
    )
  }


  createToken(payment: payment, id: string): Observable<any>{
    payment.card_number = payment.card_number.replace(/ /g, '');
    const cardRequest = {
      'card_number': payment.card_number,
      'holder_name':payment.holder_name,
      'expiration_year':payment.expiration_year,
      'expiration_month':payment.expiration_month,
      'cvv2':payment.cvv2,
   };
    return Observable.create(observer => {
        OpenPay.token.create(cardRequest, (success) => {
        const data = {
          'token_id':  success.data.id,
          'client_id': id
        }
        observer.next(data);
        observer.complete();
      }, (error) => {
          swal({title:'', text: error.data.description, type: ''})
          observer.next(error);
          observer.complete();
      })
    })
  }

  addCardClient(token_id: string, client_id: string): Observable<any>{
    const data = {
      'token_id':  token_id,
      'client_id': client_id,
      'device_session_id' : this.deviceSessionId
    }
    return this.http.post(this.apiHost ? this.apiHost + '/addCardClient' : '/addCardClient', data).pipe(map(
    (res: any) => {
      if(res.error_code){
        const errorLabel = this.errorsCatalog['_' + res.error_code]
        swal({ title: errorLabel ? errorLabel : res.description, text: '', type: '' })
        return res;
      } else {
          return {
            card: res.id,
            client: client_id,
            customerId: Boolean(res.customer_id)
          }
        }
      })
    );
  }


  addPlan(card: string, user: string, plan: string, isCustomerId): Observable<any>{
    const subscriptionRequest = {
      plan_id: plan,
      source_id : card,
      client_id: user,
      customer_id: null
   };

   if (isCustomerId) {
    subscriptionRequest.customer_id = subscriptionRequest.client_id
    delete subscriptionRequest.client_id
  } else {
    delete subscriptionRequest.customer_id
  }

   return this.http.post(this.apiHost ? this.apiHost + '/addPlan' : '/addPlan', subscriptionRequest);
  }

  sendPayment(card: string, user: string, ammount: number, redirect_url: string, isCustomerId, des:string): Observable<any>{
    const data = {
      source_id : card,
      client_id: user,
      method: 'card',
      amount: ammount,
      description: des,
      device_session_id: this.deviceSessionId,
      redirect_url: redirect_url,
      use_3d_secure: ammount >= 8500 ? true : false,
      customer_id: null
    };

    if (isCustomerId) {
      data.customer_id = data.client_id
      delete data.client_id
    } else {
      delete data.customer_id
    }

     return this.http.post(this.apiHost ? this.apiHost + '/pay' : '/pay', data);
  }

  getClientCard(card: string, client_id: string): Observable<any>{
    const data = {
      'card' : card,
      'client_id': client_id
    };
     return this.http.post(this.apiHost ? this.apiHost + '/getClientCard' : '/getClientCard', data);
  }

  getTransaction(id: string): Observable<any>{
     return this.http.get(`/pay/${id}`);
  }

  deleteClientCard(card: string, client_id: string): Observable<any>{
    const data = {
      'card' : card,
      'client_id': client_id
    };
     return this.http.post(this.apiHost ? this.apiHost + '/deleteClientCard' : '/deleteClientCard', data);
  }

  cancelSubscription(plan_id: string, client_id: string): Observable<any>{
    const data = {
      'plan_id' : plan_id,
      'client_id': client_id
    };
     return this.http.post(this.apiHost ? this.apiHost + '/cancelSubscription' : '/cancelSubscription', data);
  }


  validate(payment: payment):boolean{
    return this.validateCard(payment.card_number)  && this.validateExipry(payment.expiration_month, payment.expiration_year)
  }

  validateCard(card: string): boolean{
    const res = OpenPay.card.validateCardNumber(card);
    if(!res){
      swal({title:'Número de tarjeta invalida', text:'Porfavor verifica tu informacion he intentalo nuevamente', type: ''})
    } 
    return res;
  }

  validateCVC(card: string, cvc: string): boolean{
    const res = OpenPay.card.validateCVC(card, cvc);
    if(!res){
      swal({title:'CVC invalido', text:'Porfavor verifica tu informacion he intentalo nuevamente', type: ''})
    } 
    return res;
  }
  
  validateExipry(month: string, year: string): boolean{
    const res = OpenPay.card.validateExpiry(month, year); 
    if(!res){
      swal({title:'Fecha de expiración invalida', text:'Porfavor verifica tu informacion he intentalo nuevamente', type: ''})
    } 
    return res;
  }

  validateType(card: number): boolean{
    const res = OpenPay.card.cardType(card);
    if(!res){
      swal({title:'Tipo de trajeta invalida', text:'Porfavor verifica tu informacion he intentalo nuevamente', type: ''})
    } 
    return res;
  }
}
