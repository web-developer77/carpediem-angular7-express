import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from 'src/app/shared/models/user';
import { UserService } from 'src/app/shared/services/user.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OpenPayService } from 'src/app/shared/services/openpay.service';
import { take, finalize } from 'rxjs/operators';
import { Email } from 'src/app/shared/models/email';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

declare var $:any
declare var swal:any;

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  user = new User();
  emergency_contact = false;
  injury = false;
  mails = true;
  file: File;
  fileUrl: string;
  loading = false;
  sizes = [[36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47 , 48],
  [4, 5, 6, 7, 7.5, 8, 9, 10, 11, 11.5, 12, 13, 14],
  [23, 24, 24.5, 25, 25.5, 26, 27, 28, 28.5, 29, 30, 30.5, 31]];
  add_card = false;
  card = {
    card_number: null,
    holder_name: null,
    expiration_month: null,
    expiration_year: null,
    cvv2: null
  }

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private openPayService: OpenPayService,
    private http: HttpClient,
    private router: Router,
    private logger: NGXLogger
  ) { }

  ngOnInit() {
  }


  createUser(form: NgForm): void {
    if (form.valid){
      form.value.fileUrl = this.fileUrl;
      form.value.password = this.randomPassword(10);
      form.value.from_admin = true;
      form.value.show_size = parseFloat(form.value['show_size']);

      if (this.add_card){
        delete form.value.holder_name
        delete form.value.card_number
        delete form.value.expiration_month
        delete form.value.expiration_year
        delete form.value.cvv2
        this.openPayService.createUserCard(this.card, form.value).subscribe((res) => {
          form.value.openPay_id = res.client
          form.value.credit_cards = [res.card]
          this.authService.SignUp(form.value).then(() => {
            swal({title:'El usuario fue agregado correctamente', text:'', type:''})
            this.sendEmail( form.value.email, form.value.password );
            this.router.navigate(['/admin/users']);
          }).catch(err => {});
        })
      } else {
        this.authService.SignUp(form.value).then((res) => {
          // if res is empty object than it was succesfull
          if (!res){
            swal({title:'El usuario fue agregado correctamente', text:'', type:''});
            this.logger.info(`Admin-Crear-Usuario ${form.value.name}, ${form.value.email}`);
            this.sendEmail( form.value.email, form.value.password );
            this.router.navigate(['/admin/users']);
          }
        }).catch(err => {});
      }
    }
  }

  addFile(f): void {
    this.loading = true;
    const file = this.userService.addFile(f[0], Math.floor((Math.random() * 999999999) + 1).toString())
    file.task.snapshotChanges().pipe(
      finalize(() => {
        file.ref.getDownloadURL().subscribe(url => {
          this.fileUrl =  url;  
          this.loading = false;
        });
      })).subscribe();
  }

  randomPassword(length:number): string {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
      var i = Math.floor(Math.random() * chars.length);
      pass += chars.charAt(i);
    }
    return pass;
  }
  sendEmail(mail:string, password:string): void {
    const email: Email = {
      to: mail,
      from: 'hola@carpe-diem.mx',
      subject: 'Bienvenido a Carpe Diem',
      html: `
            <p> ¡Nos encanta que seas parte de nuestra familia! Tu cuenta está confirmada. </p>
            <p> Tu contraseña es ${password}</p>
            <button href="http://carpemx.herokuapp.com/carpe/book" class="btn_login width-100">Reserva ya tus clases</button>
            <p>Tú, aquí, ahora.</p>
            <p>CARPE DIEM</p>`
    }
    this.http.post('/sendEmail', email).subscribe(res =>{
      console.log(res)
    }, error =>{
      console.log(error);
    });
  };


}
