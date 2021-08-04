import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user';
import {take} from 'rxjs/operators'
import { ClassesService } from 'src/app/shared/services/classes.service';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { BookingService } from 'src/app/shared/services/booking.service';
import { HttpClient } from '@angular/common/http';
import { Class } from 'src/app/shared/models/class';
import { BookProcess } from 'src/app/shared/models/bookProcess';
import ExtrasJson from '../../../assets/json/extras.json';
import * as moment from 'moment';
import { Booking } from 'src/app/shared/models/bookings.js';
import { Email } from 'src/app/shared/models/email.js';
import { SubClass } from 'src/app/shared/models/sub_class.js';
import { NGXLogger } from 'ngx-logger';
import * as firebase from 'firebase/app';

declare var swal:any;

@Component({
  selector: 'manage-credits',
  templateUrl: './manage-credits.component.html',
  styleUrls: ['./manage-credits.component.scss']
})
export class ManageCreditsComponent implements OnInit {
  user: User;
  studio_credits: number;
  credits: number;
  studio_plan_expiration: string;
  plan_expiration: string;
  show_modal = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private subClassService: SubClassService,
    private bookingService: BookingService,
    private http : HttpClient,
    private logger: NGXLogger
  ) {
    this.userService.getUserByKey(data.id).pipe(take(1)).subscribe(user => {
      this.user = user;
      this.studio_credits = this.user.studio_credits;
      this.credits = this.user.credits;
      this.studio_plan_expiration = this.user.studio_plan_expiration;
      this.plan_expiration = this.user.plan_expiration;
        //variables init
    });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
   
  }

  saveCredits(){
    this.user.credits = this.credits;
    this.userService.updateUser(this.user).then(() =>{
      this.logger.info(`Admin-Actualizar-Creditos-Usuario ${this.user.$key}, ${this.user.name}, ${this.user.email}`);
      swal('Los créditos fueron actualizados', '', '')
    })
  }

  saveStudio(){
    this.user.studio_credits = this.studio_credits;
    this.userService.updateUser(this.user).then(() =>{
      this.logger.info(`Admin-Actualizar-Creditos-Usuario ${this.user.$key}, ${this.user.name}, ${this.user.email}`);
      swal('Los créditos fueron actualizados', '', '')
    })
  }

  saveExpiration(){
    this.user.plan_expiration = this.plan_expiration;
    this.userService.updateUser(this.user).then(() => {
      this.logger.info(`Admin-ExpiraciónCreditosActualizados, usuario ${this.user.name} ${this.user.last_name}, expi ${this.user.plan_expiration}`);
      swal('La fecha de vigencia fue actualizada', '', '')
    })
  }

  saveExpirationStudio(){
    this.user.studio_plan_expiration = this.studio_plan_expiration;
    this.userService.updateUser(this.user).then(() => {
      this.logger.info(`Admin-ExpiraciónCreditosActualizados, usuario ${this.user.name} ${this.user.last_name}, expi ${this.user.plan_expiration}`);
      swal('La fecha de vigencia fue actualizada', '', '')
    })
  }

  changeEx(e){
    this.plan_expiration = moment(e.target.value).format('LL').toString();
  }

  changeExStudio(e){
    this.studio_plan_expiration = moment(e.target.value).format('LL').toString();
  }
}
