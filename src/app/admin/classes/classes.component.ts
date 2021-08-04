import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource, MatSort, MatDialogRef, MatDialog} from '@angular/material';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Notice } from '../../shared/models/notice';
import { NgForm } from '@angular/forms';
import { NoticeService } from '../../shared/services/notice.service';
import { ClassesService } from '../../shared/services/classes.service';
import { Class } from '../../shared/models/class';
import { ExcelService } from '../../shared/services/excel.service';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { ActivatedRoute} from '@angular/router';
import * as  moment from 'moment';
import { AddNoteComponent } from '../add-note/add-note.component';
import { ClassUsersComponent } from '../class-users/class-users.component';
import { SubClass } from 'src/app/shared/models/sub_class';
import { NGXLogger } from 'ngx-logger';
import { take } from 'rxjs/operators';

declare var swal:any;

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit, OnDestroy{
  lo = true;
  notice = new Notice();
  notices: Notice[] = []; 
  listInit = false;
  displayedColumns: string[] = ['instructor.name', 'type', 'days', 'start', 'repeat', 'actions'];
  dataSource = new MatTableDataSource<Class>();
  subClasses = [];
  calendar:any = null;
  loadingEvents = true;
  openNote: MatDialogRef<AddNoteComponent>
  dialogRef: MatDialogRef<ClassUsersComponent>;
  filter = 'Indoor Cycling';
  classes: Class [] = [];
  sub_clases: SubClass[] = [];
  sub1: any;
  sub2: any;
  sub3: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private noticeService: NoticeService,
    private classService: ClassesService,
    private excelService: ExcelService,
    private route: ActivatedRoute,
    private subClassService: SubClassService,
    private dialog: MatDialog,
    private logger: NGXLogger
  ) {
    moment().locale('es');
    this.sub3 =this.noticeService.getNotices().subscribe((notices) =>{
      this.notices = notices;
    });
    this.sub1 = this.classService.getClassesInfo().subscribe((classes) => {
      this.dataSource.data = classes;
      this.dataSource.paginator = this.paginator;
      this.classes = classes;
      // sort for instructor name
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
    })

    // we get yesterday's date from query
    const d = new Date();
    d.setDate(d.getDate()-1);
    this.sub2 = this.subClassService.getSubClassFromDate(d).subscribe(subs => {
      this.sub_clases = subs.filter(sub => !sub.canceled);
      this.renderCalendar();
    })

    // if route has class ID than open modal
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap.has('id')) {
          // open modal with ID
          this.dialog.open(ClassUsersComponent, {
          data: { id:  paramMap.get('id') },
        });
      }
    });
  }

  ngOnInit() {
  }

  // function to render calendar
  renderCalendar() {
    if (this.calendar === null) {
      const calendarEl = document.getElementById('calendar');
      this.calendar = new Calendar(calendarEl, {
        plugins: [ dayGridPlugin ],
        locale: 'es',
        height: 480,
        events: [],
          // open the subclass reservations modal on click
          eventClick: (info: any) => {
            info.jsEvent.preventDefault(); // don't let the browser navigate
            // open modal with ID
            this.dialog.open(ClassUsersComponent, {
              data: { id:  info.event.id },
            });
          }
        });
      this.calendar.render();
    } else {
      this.calendar.getEvents().map(event => event.remove())
    }

    // we get the sub class for each class
    this.sub_clases.forEach(clase => {
      // we only look for the classes with thegiven filter (Cycling, Meditacion or Yoga)
      if(clase.type === this.filter){
        this.addToCalendar(clase)
      }
    });
    this.loadingEvents = false;
  }

  // once we found the correspondy subclass, funtion to render it
  addToCalendar(clase: SubClass): void{
    // we get the time from the class start property
    const time: string [] = clase.start.split(':', 2);
    const daytime: string[] = time[1].split(' ', 2);
    let hour: number = parseInt(time[0])
    const minutes: number = parseInt(daytime[0])
    if(daytime[1] === 'pm' && hour !== 12){
      hour += 12;
    }

    // we set the event window with the class variables
    const event = {
      title: clase.instructor.name + ' ' + clase.type,
      start: moment(clase.date, 'LL').startOf('day').add(hour, 'hours').add(minutes, 'minutes').toDate(),
      backgroundColor: 'transparent',
      borderColor	: clase.color,
      textColor : clase.color,
      id : clase.$key
    }
    this.calendar.addEvent(event);
  }

  // filter events by type and rerender calendar
  filterEvents(filter: string){
    this.filter = filter;
    this.loadingEvents = true;
    this.calendar.destroy();
    this.calendar = null;
    this.renderCalendar();
  }

  // function to filter search box
  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // funtiont o show name of day of the week in table 
  getDay(day:number): string{
    switch (day) {
      case 0:
        return "Domingo";
      case 1:
        return "Lunes";
      case 2:
         return "Martes";
      case 3:
        return "Miércoles";
      case 4:
        return "Jueves";
      case 5:
        return "Viernes";
      case 6:
        return "Sábado";
    }
  }

  deleteClass(clase: Class): void {
    swal({
      title: '¿Estás seguro que deseas eliminar esta clase?',
      text: "Recuerda que al eliminar está clase ya no se agendarán nuevas clases",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI, ELIMINAR!',
      cancelButtonText: 'CANCELAR'
    }).then(() => {
      this.classService.deleteClass(clase.$key).then(() => {
        this.logger.info(`Admin-Eliminar-Clase, ${clase.$key}`)
        this.deleteFutureClass(clase);
      }, (err) => {
        swal('Error! No fue posible eliminarla',err,'')
      });
    }, () => {});
  }

  // function to delete future subClasses
  deleteFutureClass(clase: Class){
      swal({
        title: `¿Quieres cancelar todas las clase agendandas para las proximas semanas`,
        text: "",
        type: '',
        showCancelButton: true,
        confirmButtonColor: '#A37B52',
        cancelButtonColor: '#98A9BC',
        confirmButtonText: 'SI, ELIMINAR!',
        cancelButtonText: 'CANCELAR'
      }).then(() => {
         // get all future sub with than class id 
        const d = new Date();
        d.setDate(d.getDate()-1);
        this.subClassService.getSubByClass(clase.$key, d).pipe(take(1)).subscribe(subs =>{
          const promises = []; 
          subs.forEach(sub => {
            sub.canceled = true;
            promises.push(this.subClassService.updateSubClass(sub))
          });
          Promise.all(promises).then((res) => {
            res.forEach(c => this.logger.info(`Admin-Cancelar-SubClase, ${c.$key}`))
            swal('Las clases han sido canceladas', '', '');
          }, (err) => {
            swal('Error! No fue posible cancelarla',err,'')
          });
        });
    });
  }

  // open modal to add note to class
  addNote(class_id: string){
    this.dialog.open(AddNoteComponent, {
      data: {
        id:  class_id,
        type: 'class'
      },
    });
  }

  createNotice(form: NgForm): void {
    this.noticeService.newNotice(form.value as Notice).then(() =>{
      swal({
        title: '',
        text: 'El aviso fue creado exitosamente',
        type: 'success',
        confirmButtonText: 'Cerrar'
      });
    });
  }

  ngOnDestroy(): void {
   if(this.sub1) this.sub1.unsubscribe();
   if(this.sub2) this.sub2.unsubscribe();
   if(this.sub3) this.sub3.unsubscribe();
  }
}
