import { Instructor } from '../models/instructors';
import { Injectable } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage'
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class InstructoresService {


  constructor(
    private db: AngularFirestore,
    private storage: AngularFireStorage
    ) {}

  getInstructores() {
    return this.db.collection('instructor');
  }


  getInstructoresInfo(): Observable<Instructor[]> {
    return this.db.collection('instructor').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Instructor;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  
  createInstructor(data: Instructor) {
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('instructor').add({...data});
  }

  getInstructor(data: Instructor){
    return this.db.collection('instructor').doc(data.$key);
  }

  getInstructorById(id: string): Observable<Instructor>{
    return this.db.collection('instructor').doc(id).snapshotChanges().pipe(
      map(data => {
          const d = data.payload.data() as Instructor;
          const $key = data.payload.id;
          return { $key, ...d };
      })
    );
  }

  deleteInstructor(id: string) {
    return this.db.doc('instructor/' + id).delete();
  }

  updateInstructor(data: Instructor) {
    data.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('instructor').doc(data.$key).update({... data});
  }

  addFile(file: File, title: string){
    const filePath = `instructor/${ title ? title : Math.floor(Math.random() * 999999999999).toString() }`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file)
    return {task : task, ref: fileRef};
  }
}
