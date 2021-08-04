import { Component, OnInit } from '@angular/core';
import { transition, style, animate, trigger } from '@angular/animations';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/user';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'user-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  animations: [
    trigger('panelInOut', [
        transition('void => *', [
            style({transform: 'translateY(-100%)'}),
            animate(800)
        ]),
        transition('* => void', [
            animate(800, style({transform: 'translateY(-100%)'}))
        ])
    ])
]
})
export class NavbarComponent implements OnInit {
  open = false;
  user: User;
  loggedIn: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.user = this.authService.getLoggedInUser();
    this.router.events.subscribe(event => {
      this.user = this.authService.getLoggedInUser();
    });

   }

  ngOnInit() {
  }


}
