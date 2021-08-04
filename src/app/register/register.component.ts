import { Email } from './../shared/models/email';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material';
import { TermsComponent } from '../user/terms/terms.component';
import { NoticeComponent } from '../user/notice/notice.component';
import { from } from 'rxjs';

//import { Http } from '@angular/http';
declare var $:any;
declare var swal: any;
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  TermsRef: MatDialogRef<TermsComponent>;
  NoticeRef: MatDialogRef<NoticeComponent>;
  loading = false;
  terms = false;

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private dialog: MatDialog
    ) {
      this.authService.deleteLocal();
    }

  ngOnInit() {
   
  }

  onSubmit(form: NgForm){
    if(form.valid && this.checkForm()){
      this.loading = true;
      form.value["from_admin"] = false;
      this.authService.SignUp(form.value).then(res => {
        if (!res){
          this.sendEmail(form.value["email"], form.value["name"] + form.value["last_name"]);
        }
        this.loading = false;
      })
    }
  }

  checkForm(): boolean {
    let res = true;
    if (!$('#born').val()){
      $('#born').addClass('invalid');
      res = false;
      swal({
        title: '',
        text: 'Porfavor llena todos los campos requeridos',
        type: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
    if($('#email').val() != $('#email_confirmation').val()){
      res = false;
      swal({
        title: '',
        text: 'Los correos no coinciden, verifica tus datos',
        type: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
    if($('#password').val() != $('#password_confirmation').val()){
      res = false;
      swal({
        title: '',
        text: 'Las contraseñas no coinciden, verifica tus datos',
        type: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
    return res;
  }

  sendEmail(mail: string, name:string): void {
    const email = {
      to: mail,
      from: 'hola@carpe-diem.mx',
      template: 0,
      data: name
    }
    this.http.post('/sendEmailT', email).subscribe(res =>{
      console.log(res)
    }, error =>{
      console.log(error);
    });
  };

  openTerms() {
    this.TermsRef = this.dialog.open(TermsComponent);
  }

  openNotice() {
    this.NoticeRef = this.dialog.open(NoticeComponent);
  }



}
