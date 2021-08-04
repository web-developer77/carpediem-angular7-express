import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { UserService } from 'src/app/shared/services/user.service';
import { OpenPayService } from 'src/app/shared/services/openpay.service';
import { User } from 'src/app/shared/models/user';
import { NgForm } from '@angular/forms';
import { payment } from 'src/app/shared/models/payment';
declare var swal: any;

@Component({
  selector: 'app-add-card',
  templateUrl: './add-card.component.html',
  styleUrls: ['./add-card.component.scss']
})
export class AddCardComponent implements OnInit {
  user: User;
  payment: payment = {} as payment;
  loading = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService : UserService,
    private openPayService : OpenPayService
  ) {
    this.userService.getUserByKey(data.id).subscribe(user => {
      this.user = user;
    })
   }

  ngOnInit() {
  }

  paymentForm(form: NgForm): void{
    if(form.valid){
      this.payment.card_number =  this.payment.card_number.replace(/ /g, '');
      if (!this.openPayService.validate(this.payment)) {
       return;
      }

      // if user is adding a new card or the first card
      this.loading = true;
      if(this.user.openPay_id){
        this.addCard();
      } else{
        this.openPayService.createClient(this.user).subscribe(res =>{
          this.user.openPay_id = res;
          this.addCard();
        })
      };
    }
  }

  addCard(){
    this.openPayService.createToken(this.payment, this.user.openPay_id).subscribe((res:any) => {
      if (!res.client_id){
        swal('Ocurrio un error', 'Intentalo nuevamente', '');
        this.loading = false;
        return;
      }
      this.openPayService.addCardClient(res.token_id, res.client_id).subscribe((res:any) => {
        if (res.error_code){
          console.log("error");
          swal('Ocurrio un error', 'Intentalo nuevamente', '');
          this.loading = false;
        }
        else {
          this.user.credit_cards.push(res.card);
          this.userService.updateUser(this.user).then(() => {
            swal('La tarjeta ha sido agregada', '', '');
            this.loading = false;
          })
        }
      })
    })
  }
}
