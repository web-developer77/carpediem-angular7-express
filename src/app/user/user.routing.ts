import { UserComponent } from './user.component';
import { NgModule} from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './../shared/guard/auth.guard';
import { HomeComponent } from './home/home.component';
import { BookComponent } from './book/book.component';
import { InstructorsComponent } from './instructors/instructors.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { BuyComponent } from './buy/buy.component';
import { InstructorComponent } from './instructor/instructor.component';
import { ProfileComponent } from './profile/profile.component';
import { TennisComponent } from './tennis/tennis.component';
import { VideoComponent } from './video/video.component';
export const UserRoutes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
       {
         path: 'home',
         component: HomeComponent
       },
       {
        path: 'book',
        component: BookComponent
      },
      {
        path: 'book/:type',
        component: BookComponent
      },
      {
        path: 'instructors',
        component: InstructorsComponent
      },
      {
        path: 'instructor/:id',
        component: InstructorComponent
      },
      {
        path: 'about',
        component: AboutComponent
      },
      {
        path: 'buy',
        component: BuyComponent,
        canActivate: [AuthGuard]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
      },
      {
        path: 'buy/:id',
        component: BuyComponent,
        canActivate: [AuthGuard]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
      },
      {
        path: 'tennis',
        component: TennisComponent
      },
      {
        path: 'contact',
        component: ContactComponent
      },
      {
        path: 'profile/:id',
        component: ProfileComponent,
        canActivate: [AuthGuard]                                                            
      },
      {
        path: 'video',
        component: VideoComponent                                                         
      },

    ]
  }
];



@NgModule({
	imports: [ RouterModule.forChild(UserRoutes) ],
	exports: [ RouterModule ]
})
export class UserRoutingModule {}
