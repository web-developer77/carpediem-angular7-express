import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/models/user';
import { UserService } from 'src/app/shared/services/user.service';
import { Router } from '@angular/router';
import {take} from 'rxjs/operators';

declare var swal: any;
@Component({
  selector: 'app-tennis',
  templateUrl: './tennis.component.html',
  styleUrls: ['./tennis.component.scss']
})
export class TennisComponent implements OnInit {
  user: User = new User();
  shoe_size: number;
  shoe_type: string;
  sex: string;
  sizes = [[36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47 , 48],
  [4, 5, 6, 7, 7.5, 8, 9, 10, 11, 11.5, 12, 13, 14],
  [23, 24, 24.5, 25, 25.5, 26, 27, 28, 28.5, 29, 30, 30.5, 31]];
  shoe_index = 0;
  loading = true;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    public router: Router
  ) {
    this.userService.getUserByKey(this.authService.getLoggedInUser().$key).pipe(take(1)).subscribe(user =>{
      this.user = user;
      this.loading = false;
    });
  }

  ngOnInit() {
  }

  selectShoe(){
    let valid = true;
    if(!this.sex){
      valid = false;
      swal({title: 'Información incompleta', text:'Por favor selecciona un género', type: ''})
    }
    if(!this.shoe_size){
      valid = false;
      swal({title: 'Información incompleta', text:'Por favor selecciona una talla', type: ''})
    }
    if(!this.shoe_type){
      valid = false;
      swal({title: 'Información incompleta', text:'Por favor selecciona un tipo de zapato', type: ''})
    }
    if(valid){
      this.loading = true;
      this.user.shoe_size = this.shoe_size;
      this.user.shoe_type = this.shoe_type as string;
      this.user.shoe_size = this.shoe_size;
      this.authService.SetLocal(this.user);
      this.userService.updateUser(this.user).then(() => {
        this.router.navigate(['/carpe/book']);
      });
    }

  }

  array(n: number): number[] {
    return Array(n);
  }

}
