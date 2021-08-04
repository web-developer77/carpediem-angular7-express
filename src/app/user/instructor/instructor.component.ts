import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InstructoresService } from 'src/app/shared/services/instructor.service';
import { Instructor } from 'src/app/shared/models/instructors';
import {take} from 'rxjs/operators';
import moment from 'moment'
import { ClassesService } from 'src/app/shared/services/classes.service';
import { Class } from 'src/app/shared/models/class';
interface classDate {
  date: string;
  classes: Class[];
}

@Component({
  selector: 'app-instructor',
  templateUrl: './instructor.component.html',
  styleUrls: ['./instructor.component.scss']
})

export class InstructorComponent implements OnInit {
  instructor: Instructor;
  classes: classDate[] = [];
  constructor(
    private route: ActivatedRoute,
    private instructorService: InstructoresService,
    private classService: ClassesService
  ) { 
    moment().locale('es');
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap.has('id')) {
        const id = paramMap.get('id');
        this.instructorService.getInstructorById(id).pipe(take(1)).subscribe(instructor =>{
          this.instructor = instructor;
          if (instructor.backgroundsrc){
            document.getElementById('background').style.background = `linear-gradient(0deg,rgba(0,0,0,0.3),rgba(0,0,0,0.3)), url(${instructor.backgroundsrc}) `;
          }
        });

        this.classService.getClassByInstructor(id).pipe(take(1)).subscribe(classes =>{
              // we get the class for  each day of the week
            for (let i = 0; i < 7; i++) { 
              const date = moment().add(i, 'days');
              this.classes[i] = {} as classDate;
              this.classes[i].classes = [];
              this.classes[i].date = date.format('LL').toString();
              classes.forEach(clase => {
            // we look for the subclasses 7 days in advace
              // we check that the subclass beloging to the given date has not been canceled 
              let canceled = false;
              clase.cancelations.forEach(cancelation => {
                if(moment(cancelation, 'LL').format("LL") ==  date.format("LL") ){
                  canceled = true;
                }
              })
              // if its not canceled and the class objects inculdes the day of the week
              if (clase.days.includes(date.day()) && !canceled){
                clase.date = date.format('LL').toString();
                // if the class repated every weel than we should render it
                if( clase.weeks == 'all'){
                  this.classes[i].classes.push({...clase})
                // if its only every other week we check if the class is on pair (2,4) ot inpar weeks (1,3)
                } else if (clase.weeks == 'inpair' && date.week() % 2 == 1) {
                  this.classes[i].classes.push({...clase})
                } else if (clase.weeks == 'pair' && date.week() % 2 == 0){
                  this.classes[i].classes.push({...clase})
                // if the class id only once time we check that the date is the correect one  
                } else if (clase.weeks == 'once' && moment(clase.date, "LL").format("LL") == date.format("LL")){
                  this.classes[i].classes.push({...clase})
                }
              }
            });
          }
        });
      }
    });
  }

  // function to replace big image
  changeImg(i:number):void{
    const temp = this.instructor.images[0];
    this.instructor.images[0] = this.instructor.images[i];
    this.instructor.images[i] = temp;
  }

  ngOnInit() {
  }

}
