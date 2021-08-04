import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
declare var swal:any;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email_recovery: string;
  recover = false;
  loading = false;

  constructor(
    public authService: AuthService
  ) { 
    this.authService.deleteLocal();
  }

  ngOnInit() {
  }

  onSubmit(form: NgForm){
    if (!form.valid) {
      swal({
        title: 'Error!',
        text: 'Porfavor escribe tu email y contraseña',
        type: 'error',
        confirmButtonText: 'Cerrar'
      })
      return;
    }
    this.loading = true;
    this.authService.SignIn(form.value.email, form.value.password, true).then(()=>{
      this.loading = false;
    }) ;
  }

  recoverPassword(){
    if (this.email_recovery){
      this.authService.ForgotPassword(this.email_recovery);
    } else {
      swal({title: 'Ingresa tu correo y presiona el boton nuevamente', text: '', type: ''})
    }
  }
}
