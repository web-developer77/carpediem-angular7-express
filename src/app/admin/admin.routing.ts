import { AdminComponent } from './admin.component';
import { NgModule} from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminGuard } from './../shared/guard/admin.guard';
import { HomeComponent } from './home/home.component';
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
import { BAComponent } from './ba/ba.component';

export const AdminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'home' },
      {
        path: 'home',
        component: HomeComponent
	    },
      {
        path: 'classes',
        component: ClassesComponent
      },
      {
        path: 'classes/:id',
        component: ClassesComponent
      },
      {
        path: 'add-class',
        component: AddClassComponent
      },
      {
        path: 'edit-class/:id',
        component: AddClassComponent
      },
      {
        path: 'reservations',
        component: ReservationsComponent
      },
      {
        path: 'add-reservation',
        component: AddReservationComponent
      },
      {
        path: 'edit-reservation/:id',
        component: AddReservationComponent
      },
      {
        path: 'instructors',
        component: InstructorsComponent
      },
      {
        path: 'add-instructor',
        component: AddInstructorComponent
      },
      {
        path: 'edit-instructor/:id',
        component: AddInstructorComponent
      },
      {
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'add-user',
        component: AddUserComponent
      },
      {
        path: 'user/:key',
        component: UserDetailsComponent
      },
      {
        path: 'store',
        component: StoreComponent
      },
      {
        path: 'ba',
        component: BAComponent 
      }
    ]
  }
];



@NgModule({
	imports: [ RouterModule.forChild(AdminRoutes) ],
	exports: [ RouterModule ]
})
export class AdminRoutingModule {}
