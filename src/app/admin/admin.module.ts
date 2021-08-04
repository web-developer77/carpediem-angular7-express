import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '../shared/shared.module';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AdminRoutingModule } from './admin.routing';
import { ClassesComponent } from './classes/classes.component';
import { ReservationsComponent } from './reservations/reservations.component';
import { UsersComponent } from './users/users.component';
import { InstructorsComponent } from './instructors/instructors.component';
import { StoreComponent } from './store/store.component';
import { AddClassComponent } from './add-class/add-class.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { AddInstructorComponent } from './add-instructor/add-instructor.component';
import { AddUserComponent } from './add-user/add-user.component';
import { AddReservationComponent } from './add-reservation/add-reservation.component';
import { ClassUsersComponent } from './class-users/class-users.component';
import { AddNoteComponent } from './add-note/add-note.component';
import { AddUserClassComponent } from './add-user-class/add-user-class.component';
import { AddUserCreditsComponent } from './add-user-credits/add-user-credits.component';
import { ManageCreditsComponent } from './manage-credits/manage-credits.component'
import { BAComponent } from './ba/ba.component';
import { PerfectScrollbarModule, PerfectScrollbarConfigInterface,PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  };

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule,
    PerfectScrollbarModule
  ],
  declarations: [
    AdminComponent, 
    HomeComponent,
    NavbarComponent,
    SidebarComponent,
    ClassesComponent,
    ReservationsComponent,
    UsersComponent,
    InstructorsComponent,
    StoreComponent,
    AddClassComponent,
    UserDetailsComponent,
    AddInstructorComponent,
    AddUserComponent,
    AddReservationComponent,
    ClassUsersComponent,
    AddNoteComponent,
    AddUserClassComponent,
    AddUserCreditsComponent,
    ManageCreditsComponent,
    BAComponent
  ],
  entryComponents: [
    ClassUsersComponent,
    AddNoteComponent,
    AddUserClassComponent,
    AddUserCreditsComponent,
    ManageCreditsComponent
  ],
  providers:[{
    provide: PERFECT_SCROLLBAR_CONFIG,
    useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
  }]
})
export class AdminModule { }
