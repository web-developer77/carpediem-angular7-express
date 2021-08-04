import { Component, OnInit, ViewChild } from '@angular/core';
import { ClassesService } from '../../shared/services/classes.service';
import { MatTableDataSource, MatSort, MatPaginator, MatDialog, MatDialogRef } from '@angular/material';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { SubClass } from 'src/app/shared/models/sub_class';
import {take} from 'rxjs/operators'
import { ClassUsersComponent } from '../class-users/class-users.component';
import { UserService } from 'src/app/shared/services/user.service';
import { HttpClient } from '@angular/common/http';
import * as  moment from 'moment';
import { Email } from 'src/app/shared/models/email';
import { AddNoteComponent } from '../add-note/add-note.component';
import { NGXLogger } from 'ngx-logger';
import { BookingService } from 'src/app/shared/services/booking.service';
import { Observable, combineLatest } from 'rxjs';
import { saveAs } from 'file-saver'

declare var swal: any;
@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {
  displayedColumns: string[] = ['instructor.name', 'type', 'date', 'start', 'limitNumber', 'users_count', 'view', 'actions'];
  dataSource = new MatTableDataSource<SubClass>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dialogRef: MatDialogRef<ClassUsersComponent>;
  openNote: MatDialogRef<AddNoteComponent>;
  spots = 0;
  occupancy = 0;
  riders = 0;
  total_spots = 0;
  filter = '';
  loading = true;
  sub_class: SubClass[] = [];

  constructor(
    private dialog: MatDialog,
    private subClassService: SubClassService,
    private userService: UserService,
    private http: HttpClient,
    private bookService: BookingService,
    private logger: NGXLogger
  ) { 
    
    moment().locale('es');
    const bookingsObservables: Observable<any>[] = []
    const subClassesObservables: Observable<any>[] = []
    const lastWeekDates = []
    const days = 14;
    for (let i = 0; i <= days; i++) {
      lastWeekDates.push(moment().add(days / 2, 'days').subtract(days - i, 'days').format('LL'))
    }
    lastWeekDates.map((date) => subClassesObservables.push(this.subClassService.getSubClassByDate(date)))
    combineLatest(subClassesObservables).pipe(take(1)).subscribe(bookingsByDate => {
      this.sub_class = bookingsByDate.reduce((acc, current) => {
        return [ ...acc, ...current ]
      }, []);
       // we make observble to get bookings per class
       this.sub_class.forEach(sub =>{
        bookingsObservables.push(this.bookService.getConfirmedBookings(sub.$key));
      });
      // get all bookings per class toghter once the obserables complate 
      combineLatest(bookingsObservables).pipe(take(1)).subscribe(booking =>{
        //get assistence per class
        this.sub_class.forEach((sub, i) =>{
          if(booking[i]){
            sub.users_count = booking[i].length;
            sub.users = booking[i];
          } else {
            sub.users_count = 0
          }
        });
        this.dataSource.data = this.sub_class
        this.dataSource.paginator = this.paginator;
        this.dataSource.sortingDataAccessor = (item, property) => {
          switch(property) {
            case 'instructor.name': return item.instructor.name;
            default: return item[property];
          }
        };
        this.dataSource.sort = this.sort;
        // filter for instructor name
        this.dataSource.filterPredicate = (data, filter: string)  => {
          const accumulator = (currentTerm, key) => {
            return key === 'instructor' ? currentTerm + data.instructor.name : currentTerm + data[key];
          };
          const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();
          // Transform the filter by converting it to lowercase and removing whitespace.
          const transformedFilter = filter.trim().toLowerCase();
          return dataStr.indexOf(transformedFilter) !== -1;
        };
        // reports calculation
        this.sub_class.forEach(sub =>{
          const spots: number = sub.type === 'Indoor Cycling' ? 34 : 15;
          this.total_spots += spots;
          this.spots += spots - sub.users_count;
          this.riders += sub.users_count;
        })
        this.occupancy = (this.riders / this.total_spots) * 100;
        this.loading = false;
      });
      if (this.sub_class.length === 0) {
        this.loading = false;
      }
    })
  }

  downloadHistorical() {
    const observables: Observable<any>[] = []

    this.subClassService.getSubClassesInfo().subscribe((sub_class) => {
      sub_class.forEach(sub =>{
        observables.push(this.bookService.getConfirmedBookings(sub.$key))
      })

      combineLatest(observables).pipe(take(1)).subscribe(booking => {
        sub_class.forEach((sub, i) => {
          if (booking[i]) {
            sub.users_count = booking[i].length
          }
        })

        const parseFiled = (field, fieldName) => {
          if (fieldName === 'instructor') {
            return field.name
          }

          if (fieldName === 'createdOn') {
            if (field.seconds) return new Date(field.seconds * 1000).toDateString()
          }

          return field
        }

        const replacer = (key, value) => !value ? 'null' : value
        const schema = { $key: '', class: '', color: '', date: '', start: '', end: '', instructor: '', type: '', users_count: '', users: ''}
        const header = Object.keys(schema)
        const csv = sub_class.map(row => header.map(fieldName => {
          if (typeof row[fieldName] === 'object') return JSON.stringify(parseFiled(row[fieldName], fieldName), replacer).replace(/,/g, ';').replace(/"/g, '\'')
          return JSON.stringify(row[fieldName], replacer).replace(/,/g, ';')
        }).join(','))
        csv.unshift(header.join(','))
        const csvArray = csv.join('\r\n')

        const blob = new Blob([csvArray], {type: 'text/csv' })
        saveAs(blob, 'historico.csv')
      })
    })
  }

  ngOnInit() {}

  filterIncoming(): void {
    this.filter = 'incoming';
    this.dataSource.data = this.sub_class.filter(sub_class =>  moment(sub_class.date, 'LL').isAfter(moment(), 'day'))
  }

  filterToday(): void {
    this.filter = 'today';
    this.dataSource.data = this.sub_class.filter(sub_class =>  moment(sub_class.date, 'LL').isSame(moment(), 'day'));
  }
  
  filterPrevious(): void {
    this.filter = 'previous';
    this.dataSource.data = this.sub_class.filter(sub_class =>  moment(sub_class.date, 'LL').isBefore(moment(), 'day'))
    this.dataSource.data.reverse();
  }


  openUsers(sub_class_id: string) {
    this.dialog.open(ClassUsersComponent, {
      data: { id:  sub_class_id },
    });
  }

  addNote(sub_class_id: string){
    const dialogRef = this.dialog.open(AddNoteComponent, {
      data: {
        id:  sub_class_id, 
        type: 'subclass'
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
