import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage } from "@angular/fire/storage";
import { User } from "../models/user";
import { map, take } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';
import * as firebase from 'firebase/app';

@Injectable()
export class UserService {
  selectedUser: User = new User();
  user: AngularFirestoreDocument <User>;
  users: AngularFirestoreCollection<User>;

  location = {
    lat: null,
    lon: null
  };

  constructor(private db: AngularFirestore,  private storage: AngularFireStorage  ) {
    this.getUsers();
  }

  getUsers() {
    this.users = this.db.collection('users');
    return this.users;
  }

  getUsersInfo(): Observable<User[]> {
    return this.db.collection('users').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as User;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  getUsersArray(users: string []): Observable<User[] | any[]> {
    const userQueries: Observable<User | any>[] = [];
    users.forEach(user => {
      userQueries.push(this.getUserByKey(user).pipe(take(1)));
    })
    return forkJoin(userQueries);
  }

  addUser(user: User){
    return this.users.add({...user})
  }

  getUserById(id: string){
    return this.db.collection('users', ref => ref.where('uid', '==', id).limit(1));
  }

  getUserByKey(id: string){
    return this.db.collection('users').doc(id).snapshotChanges().pipe(
      map(u => {
        const data = u.payload.data() as User;
        const $key = u.payload.id;
        return { $key, ...data };
      })
    );
  }

  getUser(user: User){
    return this.db.collection('users').doc(user.$key);
  }

  deleteUser(key: string) {
    return this.db.doc('users/' + key).delete();
  }

  updateUser(user: User) {
    user.updatedOn = firebase.firestore.FieldValue.serverTimestamp();
    user.last_session = firebase.firestore.FieldValue.serverTimestamp();
    const key = user.$key;
    return this.db.collection('users').doc(key).update({... user});
  }

  setLocation(lat, lon) {
    this.location.lat = lat;
    this.location.lon = lon;
  }

  getLoggedUser(){
    const user = JSON.parse(localStorage.getItem('user'));
    return this.getUserById(user.uid);
  }


  addFile(file: File, title: string){
    const filePath = `user/${ title ? title : 'sin_titulo' }`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file)
    return {task : task, ref: fileRef};
  }

  getUsersByDate(date: string){
    return this.db.collection('users', ref => ref.where('createdOn', '>', date )).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as User;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  getAllUsers(){
    return this.db.collection('users').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as User;
          const $key = a.payload.doc.id;
          return { $key, ...data };
        });
      })
    );
  }

  getUsersByBirthday(month:number){
    return this.db.collection('users', ref => ref.where('birthday_month', '==', month )).valueChanges();    
  }

  getActive(date: Date){
    return this.db.collection('users', ref => ref.where('last_session', '>', date )).valueChanges(); 
  }

  getInactive(date: Date){
    return this.db.collection('users', ref => ref.where('last_session', '<', date )).valueChanges();    
  }

  getSubscriptions(){
    return this.db.collection('users', ref => ref.where('subscription', '==', true )).valueChanges();    
  }

  cancelSubscription(data:any){
    data.createdOn = firebase.firestore.FieldValue.serverTimestamp();
    return this.db.collection('canceledSubscriptions').add({ ...data })
  }

}
