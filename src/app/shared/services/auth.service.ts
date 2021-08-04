import { Injectable, NgZone } from '@angular/core';
import { User } from '../models/user';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from "@angular/router";
import {UserService} from './user.service'
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { take} from 'rxjs/operators';
import { BookingService } from './booking.service';

declare var swal:any;
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  userData: firebase.User = null;// Save logged in user data
  user: Observable<firebase.User>;
  loggedUser;
  book = false;
  constructor(
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    private userService: UserService,
    public router: Router,
    public ngZone: NgZone,
    private bookService: BookingService // NgZone service to remove outside scope warning
  ) {
    moment.locale('es');
  }

  setBook(){
    this.book = true;
  }

  // Sign in with email/password
  SignIn(email: string, password: string, redirect:boolean ) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.userService.getUserById(result.user.uid).snapshotChanges().pipe(take(1)).subscribe((data) => {
          const user: User = data[0].payload.doc.data() as User;
          user.$key = data[0].payload.doc.id;
            this.SetLocal(user);
            user.last_session =  moment().toDate();
            this.userService.updateUser(user);
            if(redirect){
              if (user.admin){
                this.ngZone.run(() => {
                  this.router.navigate(['/admin/home']);
                });
              } else {
                if(this.book){
                  this.ngZone.run(() => {
                    this.router.navigate(['/carpe/book']);
                  });
                } else {
                  this.ngZone.run(() => {
                      this.router.navigate(['/carpe/home']);
                  });
                }
              }
            }
        });
      }).catch((error) => {
        swal({
          title: '',
          text: error.message,
          type: 'error',
          confirmButtonText: 'Cerrar'
        });
      });
  }

  // Sign up with email/password
  SignUp(data) {
    const user: User =  new User();
    user.name = data.name
    user.last_name = data.last_name;
    user.phone = data.phone;
    user.born = moment(data.born).format('LL').toString();
    if (data.fileUrl) user.src = data.fileUrl;
    if (data.shoe) user.shoe_size = data.shoe;
    if (data.shoe_size) user.shoe_size = data.shoe_size;
    if (data.shoe_type) user.shoe_type = data.shoe_type;
    if (data.health) user.health = data.health;
    if (data.emergency_contact)  user.emergency_contact = data.emergency_contact;
    if (data.emergency_phone)  user.emergency_phone = data.emergency_phone;
    if (data.openPay_id) user.openPay_id = data.openPay_id
    if (data.credit_cards) user.credit_cards = data.credit_cards
    return this.afAuth.auth.createUserWithEmailAndPassword(data.email, data.password)
      .then((res) => {
        console.log(res)
        user.email = res.user.email;
        user.uid = res.user.uid;
        user.admin = false;
        user.createdOn = moment().toDate();
        user.last_session = moment().toDate();
        user.birthday_month = moment(data.born).month();
        user.subscription = false;
        user.subscription_count = 0;
        user.credits = 0;
        user.plan_expiration = '';
        user.credit_cards = [];
        user.new = true;
        user.assistances = 0;

        this.userService.addUser(user).then((docRef) => {
          user.$key = docRef.id;
          if(data.from_admin == false){
            this.SetLocal(user);
            if(this.book){
              this.ngZone.run(() => {
                this.router.navigate(['/carpe/buy']);
              });
            } else {
                this.ngZone.run(() => {
                  this.router.navigate(['/carpe/home']);
                });
              }
            swal({
              title: '¡Gracias por formar parte de nuestra familia!',
              text: '',
              type: '',
              confirmButtonText: 'Cerrar'
            });
          } else {
            return 'success';
          }
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
      }).catch((error) => {
        swal({
          title: '',
          text: error.message,
          type: '',
          confirmButtonText: 'Cerrar'
        });
        return 'error';
      });
  }

  SetLocal(user: User){
    delete user.credit_cards;
    localStorage.setItem('user', JSON.stringify(user));
    JSON.parse(localStorage.getItem('user'));
  }

  // Send email verfificaiton when new user sign up
  SendVerificationMail() {
    return this.afAuth.auth.currentUser.sendEmailVerification()
    .then(() => {
      this.router.navigate(['verify-email-address']);
    })
  }

  // Reset Forgot password
  ForgotPassword(passwordResetEmail) {
    return this.afAuth.auth.sendPasswordResetEmail(passwordResetEmail)
    .then(() => {
      swal({
        title: 'Te hemos enviado un correo para restaurar tu contraseña ',
        text: '',
        type: '',
        confirmButtonText: 'Cerrar'
      });
    }).catch((error) => {
      swal({
        title: '',
        text: error,
        type: 'error',
        confirmButtonText: 'Cerrar'
      });
    })
  }

  changePassword(password: string): Promise<any>{
    return this.afAuth.auth.currentUser.updatePassword(password);
  }

  changeEmail(email: string): Promise<any>{
    return this.afAuth.auth.currentUser.updateEmail(email);
  }


  // Returns true when user is logged
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null ) ? true : false;
  }

   // Returns true when user is admin
  get Admin(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      return user.admin;
    }
    return false;
  }

  private getUser(): User {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      return user;
    } else {
      return new User();
    }
  }

  // Sign out
  SignOut() {
    return this.afAuth.auth.signOut().then(() => {
      this.bookService.deleteBook();
      localStorage.removeItem('user');
      localStorage.removeItem('payment');
      localStorage.removeItem('extras');
      localStorage.removeItem('bookProcess');
      this.isLoggedIn;
      this.router.navigate(['/carpe/home']);
    })
  }

  deleteLocal(){
    localStorage.removeItem('user');
  }

  getLoggedInUser() {
    const user = this.getUser();
    return user;
  }
}
