import { Class } from '../models/class';
import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class ClassesService {


  constructor(
    private db: AngularFirestore
    ) {}

  getClasses() {
    return this.db.collection('class');
  }


  getClassesInfo(): Observable<Class[]> {
    return this.db.collection('class').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Class;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  getAuthClasses(){
    return this.db.collection('class', ref => ref.where('auth', '==', true));
  }

  getUnAuthClasses(){
    return this.db.collection('class', ref => ref.where('auth', '==', false));
  }

  getUserClasses(user: string): AngularFirestoreCollection<Class> {
    return this.db.collection('class', ref => ref.where('user', '==', user));
  }

  createClass(data: Class) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('class').add({...data});
  }

  getClass(data: Class){
    return this.db.collection('class').doc(data.$key);
  }

  getClassById(id: string): Observable<Class>{
    return this.db.collection('class').doc(id).snapshotChanges().pipe(
      map(data => {
        return data.payload.data() as Class;
      })
    );
  }

  getClassByInstructor(id: string){
    return this.db.collection('class', ref => ref.where('instructor.$key', '==', id )).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          return a.payload.doc.data() as Class;
        });
      })
    )
  }

  deleteClass(id: string) {
    return this.db.doc('class/' + id).delete();
  }

  updateClass(data: Class) {
    data.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('class').doc(data.$key).update({... data});
  }

  getAllClasses(){
    return this.db.collection('class').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Class;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }
}
