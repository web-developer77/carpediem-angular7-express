import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatSort, MatPaginator, PageEvent } from '@angular/material';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/user';
import * as moment from 'moment';
import { NGXLogger } from 'ngx-logger';
import { ExcelService } from '../../shared/services/excel.service';
declare var swal: any;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})

export class UsersComponent implements OnInit, OnDestroy{
  displayedColumns: string[] = ['name', 'shoe_size', 'assistances', 'last_session', 'phone', 'plan','actions'];
  dataSource = new MatTableDataSource<User>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  pageEvent: PageEvent
  pageSize = 10;
  sub:any;
  users_count = 0;
  new_users = 0;
  birthday = 0;


  constructor(
    public userService: UserService,
    private logger: NGXLogger,
    private excelService: ExcelService
  ) {
    this.sub = this.userService.getUsersInfo().subscribe(users => {
      this.dataSource.data = users;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.users_count = users.length;
      users.forEach(user =>{
        // users registrated in the last month
        if ( moment(user.createdOn, 'LL').isAfter(moment().subtract(1, 'months' ))) this.new_users++;
        // check if its birthday month
        if(user.birthday_month == moment().month() ) this.birthday ++;
      });
    });
   }

  ngOnInit() {
  }



  deleteUser(user: User): void {
    swal({
      title: '¿Estás seguro que deseas eliminar este usuario?',
      text: "Recuerda que al eliminar este usuario se perdera toda la información",
      type: '',
      showCancelButton: true,
      confirmButtonColor: '#A37B52',
      cancelButtonColor: '#98A9BC',
      confirmButtonText: 'SI, ELIMINAR!',
      cancelButtonText: 'CANCELAR'
    }).then((result) => {
      this.userService.deleteUser(user.$key).then((succ) => {
        this.logger.info(`Admin-Usuario, usuario ${user.name} ${user.last_name}, email ${user.email}`);
        swal('El usuario se ha eliminado','','')
      }, (err) => {
        swal(
          'Error! No fue posible eliminarla',
          '',
          ''
        )
      });
    }, (cancel) => {});
  }

  getDate(user: User): string{
    return moment.unix(user.last_session.seconds).format('LL').toString();
  }

  downloadUsers() {
    this.excelService.exportAsExcelFile(this.dataSource.data, 'users')
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
