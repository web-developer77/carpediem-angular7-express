import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserComponent } from './user.component';
import { HomeComponent } from './home/home.component';
import { UserRoutingModule } from './user.routing';
import { SharedModule } from '../shared/shared.module';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { InstructorsComponent } from './instructors/instructors.component';
import { BookComponent } from './book/book.component';
import { BuyComponent } from './buy/buy.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { InstructorComponent } from './instructor/instructor.component';
import { MembershipComponent } from './membership/membership.component';
import { ConceptComponent } from './concept/concept.component';
import { InstructorsHomeComponent } from './instructors-home/instructors-home.component';
import { CarperidersComponent } from './carperiders/carperiders.component';
import { ProfileComponent } from './profile/profile.component';
import {NgxPaginationModule} from 'ngx-pagination';
import { TennisComponent } from './tennis/tennis.component';
import { AddCardComponent } from './add-card/add-card.component';
import { TermsComponent } from './terms/terms.component';
import { NoticeComponent } from './notice/notice.component';
import { VideoComponent } from './video/video.component';

@NgModule({
  imports: [
    CommonModule,
    UserRoutingModule,
    SharedModule,
    NgxPaginationModule
  ],
  declarations: [
    UserComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    InstructorsComponent,
    BookComponent,
    BuyComponent,
    AboutComponent,
    ContactComponent,
    InstructorComponent,
    MembershipComponent,
    ConceptComponent,
    InstructorsHomeComponent,
    CarperidersComponent,
    ProfileComponent,
    TennisComponent,
    TermsComponent,
    NoticeComponent,
    VideoComponent
  ],
  entryComponents: [TermsComponent, NoticeComponent],
})
export class UserModule { }
