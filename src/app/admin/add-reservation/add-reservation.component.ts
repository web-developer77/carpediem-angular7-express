import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { InstructoresService } from '../../shared/services/instructor.service';
import { Instructor } from '../../shared/models/instructors';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { SubClass } from 'src/app/shared/models/sub_class';
import { NGXLogger } from 'ngx-logger';

declare var $:any
declare var swal:any;


@Component({
  selector: 'app-add-reservation',
  templateUrl: './add-reservation.component.html',
  styleUrls: ['./add-reservation.component.scss']
})
export class AddReservationComponent implements OnInit {
  loading = true;
  sub_class = new SubClass();
  instructors: Instructor[] = [];
  image = '/assets/icons/user.jpg';
  edit = false;

  constructor(
    private subClassService: SubClassService,
    private instructorService: InstructoresService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: NGXLogger
  ) { 
    moment.locale('es');
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap.has('id')) {
        this.edit = true;
        this.subClassService.getSubClassById(paramMap.get('id')).subscribe(c => {
          this.sub_class = c;
          this.sub_class.$key = paramMap.get('id');
          this.sub_class.date = moment(this.sub_class.date, 'LL').toDate();
          this.image = c.instructor.src;
          this.loading = false;
        });
      }
    });
    this.instructorService.getInstructoresInfo().pipe(take(1)).subscribe((instructors) =>{
      this.instructors = instructors;
      this.loading = false;
    });
  }

  ngOnInit() {
    
  }

  imageChange(id:any): void{
    this.instructors.forEach(instructor =>{
      if (id ==  instructor.$key){
        this.image = instructor.src;
      }
    })
  }

  createClass(form: NgForm): void {
    if (form.valid){
      this.sub_class.date = moment(this.sub_class.date).format('LL').toString();
      this.instructorService.getInstructorById(this.sub_class.instructor.$key).pipe(take(1)).subscribe(instructor =>{
        this.sub_class.instructor = {$key: instructor.$key, name: instructor.name + ' ' + instructor.last_name, src: instructor.src}
        if(!this.edit){
          this.subClassService.createSubClass(this.sub_class).then(() =>{
            swal({title:'La reservación fue creada', text:'', type:''})
            this.router.navigate(['/admin/reservations']);
          });
        } else {
          this.sub_class.dateObj = moment(this.sub_class.date, 'LL').toDate(); 
          this.subClassService.updateSubClass(this.sub_class).then(()=>{
            this.logger.info(`Admin-Actualizar-SubClase , ${this.sub_class.$key}, ${this.sub_class.instructor.name},${this.sub_class.date}`);
            swal({title:'La reservación fue actualizada', text:'', type:''})
            this.router.navigate(['/admin/classes', this.sub_class.$key]);
          })
        }
      })
    }
  }
}
