import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { InstructoresService } from '../../shared/services/instructor.service';
import { MatTableDataSource, MatSort, MatPaginator } from '@angular/material';
import { Instructor } from '../../shared/models/instructors';
import { SubClass } from 'src/app/shared/models/sub_class';
import { NGXLogger } from 'ngx-logger';
declare var swal: any;
@Component({
  selector: 'app-instructors',
  templateUrl: './instructors.component.html',
  styleUrls: ['./instructors.component.scss']
})
export class InstructorsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'class_type', 'class_count', 'assistence', 'occupancy', 'actions'];
  dataSource = new MatTableDataSource<Instructor>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  sub:any;
  lessons_count = 0;
  instructor_count = 0;
  spots = 0;
  occupancy = 0;
  riders = 0;
  total_spots = 0;
  sub_classes: SubClass [] = [];
  loading = true;

  constructor(
    private instructorService: InstructoresService,
    private logger: NGXLogger
  ) {
    this.sub = this.instructorService.getInstructoresInfo().subscribe(instructors =>{
      this.instructor_count = instructors.length;
      this.dataSource.data = instructors;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      instructors.forEach(instructor => {   
        this.lessons_count += instructor.class_count;
        this.total_spots += instructor.total_spots;
        this.spots += instructor.total_spots - instructor.assistence;
        this.riders += instructor.assistence;
        this.occupancy = (this.riders / this.total_spots) * 100;
       
      });
      this.loading = false;
    })
   }

  ngOnInit() {

  }

  // funtion to delete an istructor
  deleteInstructor(instructor: Instructor): void {
    swal({
      title: '¿Estás seguro que deseas eliminar este instructor?',
      text: "Recuerda que al eliminar este instructor se perdera toda la información",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI, ELIMINAR!',
      cancelButtonText: 'CANCELAR'
    }).then((result) => {
      this.instructorService.deleteInstructor(instructor.$key).then((succ) => {
        this.logger.info(`Admin-Borrar-Instrcutor, ${instructor.$key}`);
        swal('El instructor se ha eliminado','','');
      }, (err) => {
        swal('Error! No fue posible eliminarla','','');
      });
    }, (cancel) => {});
  }

  // functiont o filter search results
  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
