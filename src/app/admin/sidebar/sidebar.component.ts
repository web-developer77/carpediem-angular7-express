import { Component, OnInit} from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/user';
import { Observable } from 'rxjs';
declare var $:any

@Component({
  selector: 'admin-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  user: User = new User();
  constructor(
    public authService: AuthService
  ) {
    this.user = this.authService.getLoggedInUser()
  }

  ngOnInit() {

  }

  hideMenu(){
    if (window.screen.width < 600) { 
      $("#navi-toggle").click();
      $(".layout_sidebar").fadeOut();
    }
  }

}
