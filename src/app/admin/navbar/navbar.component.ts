import { Component, OnInit, OnDestroy} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/user';

declare var $: any;
@Component({
  selector: 'admin-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public link = 'Inicio'
  public imgUrl = '/assets/icons/gold/inicio.png'
  user = new User();
  sub: any;
  constructor(
     private router: Router,
     public authService: AuthService
    ) {
    this.user = this.authService.getLoggedInUser();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart){
        if (event.url == '/admin/home' ) {
          this.link = 'Inicio';
          this.imgUrl = '/assets/icons/gold/inicio.png'
        }

        if (event.url == '/admin/classes' ) {
          this.link = 'Clases';
          this.imgUrl = '/assets/icons/gold/clases.png'
        }

        if (event.url == '/admin/add-class') {
          this.link = 'Clases';
          this.imgUrl = '/assets/icons/gold/clases.png'
        }

        if (event.url == '/admin/reservations' ) {
          this.link = 'Reservaciones';
          this.imgUrl = '/assets/icons/gold/reservaciones.png'
        }
        if (event.url == '/admin/users' ) {
          this.link = 'Usuarios';
          this.imgUrl = '/assets/icons/gold/usuarios.png'
        }
        if (event.url == '/admin/instructors' ) {
          this.link = 'Instructores';
          this.imgUrl = '/assets/icons/gold/instructores.png'
        }
        if (event.url == '/admin/store' ) {
          this.link = 'Tienda';
          this.imgUrl = '/assets/icons/gold/tienda.png'
        }

        if (event.url == '/admin/ba' ) {
          this.link = "KPI's";
          this.imgUrl = '/assets/icons/gold/kpi.png'
        }
      }
    });

    // this.notificationService.getNotificationById(this.user.$key).subscribe(notifications => {
    //   this.notifications = notifications;
    // });
  }

  toggle(){
    $(".layout_sidebar").fadeToggle();
  }

  toggleNot(){
    $(".navbar_notifications").fadeToggle();
  }

  // clearNot(){
  //   this.notifications.forEach((notification) =>{
  //     this.notificationService.deleteNotification(notification.$key);
  //   });
  //   this.toggleNot()
  // }

  ngOnInit() {

  }


}
