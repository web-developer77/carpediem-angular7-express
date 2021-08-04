import { Notice } from '../models/notice';
import { Injectable } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class NoticeService {
  message: string;
  constructor(
    private db: AngularFirestore
    ) {}

  getNotices() {
    return this.db.collection('notice').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Notice;
          const $key = a.payload.doc.id;
          return {$key, ...data };
        });
      })
    );
  }

  getNoticeById(id: string): Observable<Notice[]>  {
    return  this.db.collection('notice', ref => ref.where('user_id', '==', id)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Notice;
          const $key = a.payload.doc.id;
          return {$key, ...data };
        });
      })
    );
  }


  newNotice(data: Notice) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('notice').add({...data});
  }


  deleteNotice(id: string) {
    return this.db.doc('notice/' + id).delete();
  }

  updateNotice(data: Notice) {
    data.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('notice').doc(data.$key).update(data);
  }
}
