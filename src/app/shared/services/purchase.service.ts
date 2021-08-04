import { Injectable } from "@angular/core";
import { AngularFirestore} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Purchase } from '../models/purchase';
import * as firebase from 'firebase/app';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {


  constructor(
    private db: AngularFirestore
    ) {}

  getPurchasess() {
    return this.db.collection('purchase');
  }


  getPurchaseInfo(): Observable<Purchase[]> {
    return this.db.collection('purchase').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Purchase;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  createPurchase(data: Purchase) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('purchase').add({...data});
  }

  getPurchaseId(id: string): Observable<Purchase>{
    return this.db.collection('purchase').doc(id).snapshotChanges().pipe(
      map(data => {
        return data.payload.data() as Purchase;
      })
    );
  }

  deletePurchase(id: string) {
    return this.db.doc('purchase/' + id).delete();
  }

  updatePurchase(data: Purchase) {
    data.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('purchase').doc(data.$key).update({... data});
  }

  getPurchaseByUser(user: string){
    return this.db.collection('purchase', ref => ref.where('user', '==', user)).snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as Purchase;
            const $key = a.payload.doc.id;
            return { $key, ...data };
          });
    }));
  }

  // get bookings by a date
  getPurchasessByMonth(start: Date, end: Date ){
    return this.db.collection('purchase', ref => ref.where('createdOn', '>', start)
    .where('createdOn', '<', end ).where('card', '==', 'Pago en Mostrador')).valueChanges();
  }


  getPurchasessBySubscription(monthStart: Date ){
    return this.db.collection('purchase', ref => ref.where('subscription', '==', true)
    .where('createdOn', '>', monthStart )).valueChanges();
  }


  getCancelations(monthStart: Date ){
    return this.db.collection('FailedSubscriptions', ref => ref.where('createdOn', '>', monthStart )).valueChanges();
  }

  getOpenSubscriptions(monthStart: Date ){
    return this.db.collection('SuccessfulSubscriptions', ref => ref.where('createdOn', '>', monthStart )).valueChanges();
  }

  getRenovations(date: Date ){
    return this.db.collection('purchase', ref => ref.where('subscription', '==', true).where('expirationObj', '>', date )).valueChanges();
  }

  createPurchaseUpdateUser(purchase: Purchase, user: User){
     //--create batch-- 
     var batch = this.db.firestore.batch();

     purchase.createdOn = firebase.firestore.FieldValue.serverTimestamp();
     const purchaseRef = this.db.collection('purchase').doc(this.db.createId()).ref;
     batch.set(purchaseRef , purchase);

     const userRef = this.db.collection('users').doc(user.$key).ref;
     batch.update(userRef , {... user});

     return batch.commit();
  }

  getPurchaseByPayment(payment: string){
  return this.db.collection('purchase', ref => ref.where('card', '==', payment)).snapshotChanges().pipe(
    map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Purchase;
        const $key = a.payload.doc.id;
        return { $key, ...data };
      });
    }));
  }
}
