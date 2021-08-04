

import { Injectable } from '@angular/core';
import { Discount } from '../models/discount';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {

  constructor(
    private db: AngularFirestore
  ) { }

  getDiscounts() {
    return this.db.collection('discount');
  }

  getDiscountByCode(code: string): Observable<any[]> {
    return this.db.collection('discount', ref => ref.where('code', '==', code).limit(1)).valueChanges();
  }

  getDiscountsInfo(): Observable<Discount[]> {
    return this.db.collection('discount').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Discount;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  
  createDiscount(data: Discount) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('discount').add({...data});
  }

  deleteDiscount(key: string) {
    return this.db.doc("discount/" + key).delete();
  }
}