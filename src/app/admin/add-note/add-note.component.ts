import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { SubClass } from 'src/app/shared/models/sub_class';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { Class } from 'src/app/shared/models/class';
import { ClassesService } from 'src/app/shared/services/classes.service';
import { take } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
declare var swal:any; 

@Component({
  selector: 'app-add-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss']
})
export class AddNoteComponent implements OnInit {
  object: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private subClassService: SubClassService,
    private classService: ClassesService
  ) { 
    if(data.type === 'class') {
      this.classService.getClassById(data.id).pipe(take(1)).subscribe(clase => this.object = clase);
    } else {
      this.subClassService.getSubClassById(data.id).pipe(take(1)).subscribe(sub => this.object = sub);
    }
  }

  ngOnInit() {
  }

  addNote(from: NgForm){
    if(this.data.type === 'class'){
      this.classService.updateClass(this.object).then( () => {
        swal('La nota ha sido guardada', '', '');
      });
    } else {
      this.subClassService.updateSubClass(this.object).then( () => {
        swal('La nota ha sido guardada', '', '');
      });
    }
  }

}
