import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { TermsComponent } from '../terms/terms.component';
import { HttpClient } from '@angular/common/http';
import { NoticeComponent } from '../notice/notice.component';
import { PurchaseService } from 'src/app/shared/services/purchase.service';
import { ExcelService } from 'src/app/shared/services/excel.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  TermsRef: MatDialogRef<TermsComponent>;
  NoticeRef: MatDialogRef<NoticeComponent>;

  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    ) { }

  ngOnInit() {
  }

  scroll(id: string): void {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  }

  openTerms() {
    this.TermsRef = this.dialog.open(TermsComponent);
  }

  openNotice() {
    this.NoticeRef = this.dialog.open(NoticeComponent);
  }

  sendEmail() {
    let email = {
      to: 'danielcharua@hotmail.com',
      from : "carpe@admin.com",
      subject : "Gracias por registrarte",
      title: "Bienvenido a carpe",
      message : "Tu solicitud sera revisada pronto",
    }
    this.http.post('/sendEmail', email).subscribe(suc => {
      console.log(suc);
    }, err => {
        console.log(err);
    });
  }

}
