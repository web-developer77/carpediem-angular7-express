import { Injectable } from "@angular/core";
import { AngularFirestore} from '@angular/fire/firestore';
import { map } from 'rxjs/operators'
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class StatsService {


  constructor(
    private db: AngularFirestore
    ) {}

    getHomeStatsInfo(){
        return this.db.collection('home_stats').snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              const data = a.payload.doc.data() as any;
              const $key = a.payload.doc.id;
              return { $key, ...data };
            });
          })
        );
      }

  saveHomeStats(stats: any) {
    stats.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('home_stats').add({...stats});
  }

  updateHomeStats(stats: any) {
    stats.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('home_stats').doc(stats.$key).update({...stats});
  }

  deleteStats(id: string) {
    return this.db.doc('home_stats/' + id).delete();
  }
}
