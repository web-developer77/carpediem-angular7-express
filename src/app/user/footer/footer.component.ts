import { Component, OnInit } from '@angular/core';
import { TermsComponent } from '../terms/terms.component';
import { MatDialogRef, MatDialog } from '@angular/material';
import { NoticeComponent } from '../notice/notice.component';

@Component({
  selector: 'user-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  TermsRef: MatDialogRef<TermsComponent>;
  NoticeRef: MatDialogRef<NoticeComponent>;

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  openTerms() {
    this.TermsRef = this.dialog.open(TermsComponent);
  }


  openNotice() {
    this.NoticeRef = this.dialog.open(NoticeComponent);
  }


}
