import { Injectable } from "@angular/core";
import { AngularFirestore} from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SubClass } from '../models/sub_class';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class SubClassService {


  constructor(
    private db: AngularFirestore
  ) {}

  getSubClasses() {
    return this.db.collection('sub_class');
  }


  getSubClassesInfo(): Observable<SubClass[]> {
    return this.db.collection('sub_class').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as SubClass;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  createSubClass(data: SubClass) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('sub_class').add({...data});
  }

  getSubClassById(id: string): Observable<SubClass>{
    return this.db.collection('sub_class').doc(id).snapshotChanges().pipe(
      map(data => {
        return { ...data.payload.data() as SubClass, $key: id };
      })
    );
  }

  deleteSubClass(id: string) {
    return this.db.doc('sub_class/' + id).delete();
  }

  updateSubClass(data: SubClass) {
    data.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('sub_class').doc(data.$key).update({... data});
  }

  getClassByDate(clase: string, date: string){
    return this.db.collection('sub_class', ref => ref.where('class', '==', clase).where('date', '==', date).limit(1)).snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as SubClass;
            const $key = a.payload.doc.id;
            return { $key, ...data };
        });
    }));
  }

  getSubByClass(clase: string, date: Date){
    return this.db.collection('sub_class', ref => ref.where('class', '==', clase).where('dateObj', '>', date)).snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as SubClass;
            const $key = a.payload.doc.id;
            return { $key, ...data };
        });
    }));
  }

  getSubClassByDate(date: string) {
    return this.db.collection('sub_class', ref => ref.where('date', '==', date )).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as SubClass;
          const $key = a.payload.doc.id;
          return { $key, ...data }
        })
      })
    )
  }

  getSubClassByInstructor(id: string) {
    return this.db.collection('sub_class', ref => ref.where('instructor.$key', '==', id )).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as SubClass;
          const $key = a.payload.doc.id;
          return { $key, ...data }
        })
      })
    )
  }

  getSubClassFromDate(date: Date) {
    return this.db.collection('sub_class', ref => ref.where('dateObj', '>', date )).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as SubClass;
          const $key = a.payload.doc.id;
          return { $key, ...data }
        })
      })
    )
  }

}