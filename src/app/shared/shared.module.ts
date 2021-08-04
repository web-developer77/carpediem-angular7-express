import { FooterComponent } from './footer/footer.component';
import { NgModule } from "@angular/core";
import { FormsModule, FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from '@angular/router';
import { ChartsModule } from 'ng2-charts';
import { MatProgressBarModule} from '@angular/material/progress-bar';
import { MatTabsModule} from '@angular/material/tabs';
import { MatTableModule} from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl} from '@angular/material/paginator'
import { MatSortModule} from '@angular/material/sort'
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatSelectModule} from '@angular/material/select'
import { MatDatepickerModule} from '@angular/material/datepicker';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatDialogModule} from '@angular/material/dialog';
import { MatNativeDateModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { MatButtonModule} from '@angular/material/button';
import { PaginatorEspañol } from './paginator-español';
import { NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { NgxCleaveDirectiveModule } from 'ngx-cleave-directive';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MomentPipe } from '../shared/moment.pipe';
import { GetClassPipe } from './get-class-by-type.pipe';
import { OrderByHourPipe } from './get-class-by-hour.pipe';


@NgModule({
	imports: [
    CommonModule,
    RouterModule,
	FormsModule,
	ReactiveFormsModule,
	ChartsModule,
	MatProgressBarModule,
	MatTabsModule,
	MatTableModule,
	MatPaginatorModule,
	MatSortModule,
	MatCheckboxModule,
	MatSelectModule,
	MatDatepickerModule,
	MatFormFieldModule,
    MatNativeDateModule,
	MatInputModule,
	MatButtonModule,
	MatExpansionModule,
	MatDialogModule,
	NgxMaterialTimepickerModule,
	SlickCarouselModule,
	NgxCleaveDirectiveModule,
	MatRadioModule,
	MatAutocompleteModule

	],
	declarations: [
	FooterComponent,
	MomentPipe, 
	GetClassPipe,
	OrderByHourPipe
	],
	exports: [
    FooterComponent,
	FormsModule,
	ReactiveFormsModule,
	ChartsModule,
	MatProgressBarModule,
	MatTabsModule,
	MatTableModule,
	MatPaginatorModule,
	MatSortModule,
	MatCheckboxModule,
	MatSelectModule,
	MatDatepickerModule,
	MatFormFieldModule,
    MatNativeDateModule,
	MatInputModule,
	MatButtonModule,
	MatExpansionModule,
	MatDialogModule,
	NgxMaterialTimepickerModule,
	SlickCarouselModule,
	NgxCleaveDirectiveModule,
	MatRadioModule,
	MatAutocompleteModule,
	MomentPipe, 
	GetClassPipe,
	OrderByHourPipe
	],
	providers: [FormBuilder, MatDatepickerModule, { provide: MatPaginatorIntl, useClass: PaginatorEspañol}]
})
export class SharedModule { }
