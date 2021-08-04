import { UserService } from './../services/user.service';
import { User } from './../models/user';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})

export class AdminGuard implements CanActivate {
  user: User = new User();
  sub;
  constructor(
    public authService: AuthService,
    public router: Router,
    public userService: UserService
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    this.user =  this.authService.getLoggedInUser();
    if(!this.user.admin) {
        window.alert("You are not allowed to access this URL!");
        this.router.navigate(['/login']);
        return false;
    } else {
      return true;
    }
  }

}
