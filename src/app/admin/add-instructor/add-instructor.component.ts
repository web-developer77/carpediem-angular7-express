import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { InstructoresService } from '../../shared/services/instructor.service';
import { Instructor } from '../../shared/models/instructors';
import { take, finalize } from 'rxjs/operators';
import { from } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { NGXLogger } from 'ngx-logger';

declare var $:any
declare var swal:any;

@Component({
  selector: 'app-add-instructor',
  templateUrl: './add-instructor.component.html',
  styleUrls: ['./add-instructor.component.scss']
})
export class AddInstructorComponent implements OnInit {
  instructor = new Instructor();
  emergency_contact = false;
  injury = false;
  file: File;
  background: File;
  loading = true;
  edit = false;
  thumb

  constructor(
    private instructorService: InstructoresService,
    private route: ActivatedRoute,
    private router: Router,
    private logger: NGXLogger
  ) { 
    this.instructor.src = '/assets/icons/user.jpg';
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap.has('id')) {
        this.instructorService.getInstructorById(paramMap.get('id')).subscribe(i => {
          this.instructor = i;
          this.thumb = this.instructor.src
          this.instructor.$key = paramMap.get('id');
          this.edit = true;
          this.instructor.birthday = moment(this.instructor.birthday, 'LL').toDate();
          this.loading=false;
        });
      } else {
        this.loading = false;
      }
    });
  }

  ngOnInit() {
  }


  createInstructor(form: NgForm): void{
    if (form.valid){
      this.instructor.birthday = moment(this.instructor.birthday).format('LL').toString();
      this.loading = true;
      if(!this.edit){
        this.instructor.class_count = 0;
        this.instructor.assistence = 0;
        this.instructor.occupancy = 0;
        this.instructor.total_spots = 0;
        this.instructorService.createInstructor(this.instructor).then((instructor) =>{
          if(this.file){
            this.addFile(instructor.id, form);
          } else {
            this.logger.info(`Admin-Crear-Instructor ${this.instructor.$key}, ${this.instructor.name}`);
            swal({title:'El instructor se agrego correctamente', text:'', type:''})
            form.resetForm()
            this.loading = false;
            this.router.navigate(['/admin/instructors']);
          }
        }).catch(()=>{
          swal({title:'Ocurrio un error al crear el instructor', text:'', type:''})
        });
      } else {
        if(this.file) {
          this.addFile(this.instructor.$key, form);
          return
        }

        this.instructorService.updateInstructor(this.instructor).then(() => {
          this.logger.info(`Admin-Actualizar-Instructor ${this.instructor.$key}, ${this.instructor.name}`);
          swal({title:'El instructor se editó correctamente', text:'', type:''})
          form.resetForm()
          this.loading = false;
          this.router.navigate(['/admin/instructors']);
        }, err =>{
          console.log(err);
        });
      }
    }
  }

  addFile(id: string, form: NgForm): void {
    const file = this.instructorService.addFile(this.file, id)
    file.task.snapshotChanges().pipe(
      finalize(() => {
        file.ref.getDownloadURL().subscribe(url => {
          this.instructor.src = url;
          this.instructor.$key = id;
          this.instructorService.updateInstructor(this.instructor).then(() =>{
            swal({title:'El instructor se agrego', text:'', type:''})
            form.resetForm()
            this.loading = false;
          }).catch(()=>{
            swal({title:'Ocurrio un error al subir la foto', text:'', type:''})
          });
        });
      })).subscribe();
    };

    parseFile(file) {
      const scope = this
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = function () {
        scope.file = file
        scope.thumb = reader.result
      }
      
      reader.onerror = function (error) {
        console.log('Error: ', error)
      };
   }

   addBackground(f){
    this.loading = true;
    const file = this.instructorService.addFile(f[0], Math.floor((Math.random() * 999999999) + 1).toString())
    file.task.snapshotChanges().pipe(
      finalize(() => {
        file.ref.getDownloadURL().subscribe(url => {
          swal('Se agregó la foto', 'recuerda presionar el botón de guardar', '');
          this.instructor.backgroundsrc =  url;
          this.loading = false;
        });
      })).subscribe();
  }

  deleteback(){
    swal({
      title: '¿Estás seguro que deseas eliminar esta foto?',
      text: "",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI, ELIMINAR!',
      cancelButtonText: 'CANCELAR'
    }).then((result) => {
      this.instructor.backgroundsrc = '';
      swal('Se borró la foto', 'recuerda presionar el botón de guardar', '');
    }, (cancel) => {});
  }


  addImage(f){
    this.loading = true;
    const file = this.instructorService.addFile(f[0], Math.floor((Math.random() * 999999999) + 1).toString())
    file.task.snapshotChanges().pipe(
      finalize(() => {
        file.ref.getDownloadURL().subscribe(url => {
          if (!this.instructor.images) this.instructor.images = [];
          this.instructor.images.push(url);
          this.loading = false;
          swal('Se agregó la foto', 'recuerda presionar el botón de guardar', '');
        });
      })).subscribe();
  }
  deleteimg(i: number){
    swal({
      title: '¿Estás seguro que deseas eliminar esta foto?',
      text: "",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI, ELIMINAR!',
      cancelButtonText: 'CANCELAR'
    }).then((result) => {
      this.instructor.images.splice(i, 1);
      swal('Se borró la foto', 'recuerda presionar el botón de guardar', '');
    }, (cancel) => {});
  }

}
