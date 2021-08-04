import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Class } from '../../shared/models/class';
import { ClassesService } from '../../shared/services/classes.service';
import { InstructoresService } from '../../shared/services/instructor.service';
import { Instructor } from '../../shared/models/instructors';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { NGXLogger } from 'ngx-logger';
import { SubClass } from 'src/app/shared/models/sub_class';

declare var $:any
declare var swal:any;

@Component({
  selector: 'app-add-class',
  templateUrl: './add-class.component.html',
  styleUrls: ['./add-class.component.scss']
})

export class AddClassComponent implements OnInit {
  loading = true;
  loadingForm = false;
  class = new Class();
  instructors: Instructor[] = [];
  image = '/assets/icons/user.jpg'
  edit = false;
  today = new Date();

  constructor(
    private classesService: ClassesService,
    private instructorService: InstructoresService,
    private route: ActivatedRoute,
    private subClassService: SubClassService,
    private logger: NGXLogger,
    private router: Router
  ) { 
    moment.locale('es');
    this.class.sub_class = [];
    this.class.cancelations = [];
    // if route has class ID than its edit
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap.has('id')) {
        this.classesService.getClassById(paramMap.get('id')).subscribe(c => {
          this.class = c;
          console.log(this.class.instructor)
          this.class.$key = paramMap.get('id');
          this.class.date = moment(this.class.date, 'LL').toDate();
          this.image = c.instructor.src;
          this.edit = true;
        });
      }
    });
    this.instructorService.getInstructoresInfo().pipe(take(1)).subscribe((instructors) =>{
      this.instructors = instructors;
      this.loading = false;
    });
  }

  ngOnInit() {
    this.class.reservations = false;
    this.class.limit = false;
  }

  // function to change displayed image on instructor select
  imageChange(e:any): void{
    if (e){
      this.instructors.forEach(instructor =>{
        if (e.$key === instructor.$key){
          this.image = instructor.src;
        }
      })
    }
  }

  // from sumbit function
  createClass(form: NgForm): void {
    if (form.valid){
      this.loadingForm = true;
      this.class.date = moment(this.class.date).format('LL').toString();
      // if its only a one time class we dont create the class object only the subclass
      if(this.class.repeat == "Nunca"){
        this.createSubClass().then((res) => {
          this.success(`Admin-Crear-ClaseUnica ,Subid: ${res.id}`,'La clase fue creada', `Se agregó la sesión del ${this.class.date} al calendario` )
        });
        return;
      }
      // else if its not edit we fill the repeate variables
      if(!this.edit){
        this.fillReapet();
        // create the class and than create the future classes
        this.classesService.createClass(this.class).then((res) =>{
          this.class.$key = res.id;
          this.createFuture().then((res) => {
            this.success(`Admin-Crear-Clase  ${this.class.$key}, ${this.class.instructor.name}, ${this.class.instructor.name}`,
            'La clase fue creada', 'Se generarán automaticamente las clases cada semana')
          });
        });
      } else {
        // update class
        this.classesService.updateClass(this.class).then(()=>{
          // get all future sub with than class id 
          const d = new Date();
          d.setDate(d.getDate()-1);
          this.subClassService.getSubByClass(this.class.$key, d).pipe(take(1)).subscribe(subs =>{
            subs.forEach(sub =>{
              // if its a future subClass update info and save
              sub.color = this.class.color;
              sub.instructor = this.class.instructor;
              sub.type = this.class.type;
              sub.start = this.class.start;
              sub.end = this.class.end;
              sub.description = this.class.description;
              // missing send mail to each user
              this.subClassService.updateSubClass(sub);
            });
            this.success(`Admin-Actualizar-Clase ${this.class.$key}, ${this.class.instructor.name}, ${this.class.instructor.name}`, 'La clase fue actualizada', '');
          });
        });
      }
    }
  }
  
  // function to create a single sub_class from class
  createSubClass(): Promise<any>{
    const sub_class: SubClass = {
      class : this.class.$key ? this. class.$key : 'unica',
      color : this.class.color,
      date : this.class.date,
      dateObj : moment(this.class.date, 'LL').toDate(),
      end : this.class.end,
      instructor : this.class.instructor,
      start : this.class.start,
      type : this.class.type,
      description: this.class.description ? this.class.description : '',
    }
    return this.subClassService.createSubClass(sub_class);
  }

  // function to generate all future classes for the month
  createFuture(): Promise<any>{
    // we find the first monday in 5 weeks since thats the day the cron stoped in generaing weekly new classes
    // we must cover and create all new subclases for weeks already generated by cron job
    const end_date = moment().add(4, 'weeks').subtract(moment().day(), 'days');
    const date = moment(this.class.date, 'LL');
    const diff = end_date.diff(date, 'days');
    let promises = [];
    for (let i = 0; i <= diff; i++){
          // if the class objects inculdes the day of the week
      if (this.class.days.includes(date.day())){
         // we change the date in case of a match
        this.class.date = date.format('LL').toString();
        // if the class repated every weel than we should render it
        if( this.class.weeks === 'all'){
          promises.push(this.createSubClass());
        // if its only every other week we check if the class is on pair (2,4) ot inpar weeks (1,3)
        } else if (this.class.weeks === 'inpair' && date.week() % 2 === 1) {
          promises.push(this.createSubClass());
        } else if (this.class.weeks === 'pair' && date.week() % 2 === 0){
          promises.push(this.createSubClass());
        } 
      }
      date.add(1, 'days');
    }
    return Promise.all(promises);
  }

  // funtion to fill variables used to repeat class
  fillReapet(): void {
    this.class.weeks = '';
    this.class.days = [];
    if (this.class.repeat === 'Cada dia') {
      this.class.days = Array.from(Array(7), (x, index) => index);
      this.class.weeks = 'all';
    } else  if (this.class.repeat === 'Todas las semanas') {
      this.class.days.push(moment(this.class.date, 'LL').day());
      this.class.weeks = 'all';
    } else  if (this.class.repeat === 'Cada dos semanas') {
      this.class.days.push(moment(this.class.date, 'LL').day());
      this.class.weeks = moment(this.class.date, 'LL').week() % 2 ? 'inpair' : 'pair';
    }
  }

  // log, show modal and navagate away
  success(log:string, modal_title:string, modal_text){
    this.logger.info(log)
    this.loadingForm = false;
    swal({title: modal_title, text:modal_text, type:''});
    this.router.navigate(['/admin/classes']);
  }

}
