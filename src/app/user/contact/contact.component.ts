import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Email } from 'src/app/shared/models/email';
import { User } from 'src/app/shared/models/user';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
declare var swal: any;

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  email: Email = {};
  user: User = new User()
  message: string;
  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.user = this.authService.getLoggedInUser();
  }

  ngOnInit() {
  }

  contact(form: NgForm){
    this.email.from = this.user.email;
    this.email.to = 'hola@carpe-diem.mx';
    this.email.html = `<h2>Contacto desde tu página web</h2>
                      <h5>${this.user.name} ${this.user.last_name} te ha enviado un mensaje<h5>
                      <p> ${this.message} </p>`
    this.http.post('/sendEmail', this.email).subscribe(res =>{
      console.log(res)
      swal('Tu mensaje ha sido enviado', 'Nos pondremos en contacto muy pronto, Gracias', '');
    }, error =>{
      console.log(error);
    });
  }

}
