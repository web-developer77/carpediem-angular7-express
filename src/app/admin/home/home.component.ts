import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/shared/services/user.service';
import { BookingService } from 'src/app/shared/services/booking.service';
import { SubClassService } from 'src/app/shared/services/sub_class.service';
import { StatsService } from 'src/app/shared/services/stats.service';
import * as  moment from 'moment';
import { Observable, combineLatest } from 'rxjs';
import { take} from 'rxjs/operators';
import { SubClass } from 'src/app/shared/models/sub_class';

const colorsMatrix = {
  bookingAvailable: '#a77f57',
  allUsersCount: '#3c75f1',
  canceled: '#EA5455',
  assistence : '#28C76F',
  noShow : '#FF9F43',
  selected : '#5c5c5cb2'
}

class homeData {
  $key: string;
  createdOn: Date;
  confirmed_users: number[];
  canceled_users: number[];
  selected_users: number[];
  assisted_users: number[];
  free_spots: number[];
  new_users: number[];
  bookingAvailable: number;
  assistence: number;
  noShow: number;
  canceled: number;
  usersCount: number;
  newUserCount: number;
  occupancy: number;
  unfinishedBookings: number;
  totalBooking: number;
  totalSpots: number;
  totalBookings: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  home_data: homeData  = new homeData()
  bookingAvailable: number = 0;
  usersCount: number = 0;
  subClasses: SubClass[] = [];
  newUsers: Array<any> = [];
  newUsersCount: number = 0;
  occupancy:  number = 0;
  last15Dates = []
  barChartMaxValue = 0
  barChartResults: number [] = []
  chartColor = '';
  resumeNumber = 0
  currentStatsLabel = '';
  assistence = 0;
  noShow = 0;
  canceled = 0;
  unfinishedBookings = 0;
  totalBookings = 0;
  totalSpots = 0;
  nextClasses = []
  hoverDay = '';
  loading = true;
  todayDate:any;
  dataDays = 15;
  confirmed_users = new Array(this.dataDays).fill(0);
  canceled_users = new Array(this.dataDays).fill(0);
  selected_users = new Array(this.dataDays).fill(0);
  assisted_users = new Array(this.dataDays).fill(0);
  free_spots = new Array(this.dataDays).fill(0);
  new_users = new Array(this.dataDays).fill(0);
  constructor(
    private userService: UserService,
    private bookingService: BookingService,
    private subClassService: SubClassService,
    private statsService: StatsService
  ) {
    moment.locale('es');
    this.todayDate = moment().format('LL').toString();
    for (let i = 0; i < this.dataDays; i++) {
      this.last15Dates.push(moment().subtract(this.dataDays - i, 'days').format('LL').toString())
    }
    this.loadStats();
    this.getTodayClasses();
  }
  
  loadStats(){
   this.statsService.getHomeStatsInfo().pipe(take(1)).subscribe((stats: any) => {
     if (stats[0]){
       this.home_data = stats[0];
       if(moment().diff(moment.unix(stats[0].createdOn.seconds), 'hours') > 24){
         this.getData();
         this.getUsersData();
         this.loading = false;
       } else {
         this.loading = false;
         this.setBarCharts('bookingAvailable');
       }
    } else {
      this.getData();
      this.getUsersData();
      this.loading = false;
    }
   });

 
  }

  getData() {
    const subClassesObservables: Observable<any>[] = [];
    const bookingsObservables: Observable<any>[] = [];
    // we get the subclasses from the last 15 days in one observable
    this.last15Dates.map((day) => subClassesObservables.push(this.subClassService.getSubClassByDate(day)));
    // we combine the observable as subscribe to get the subclasses
    combineLatest(subClassesObservables).pipe(take(1)).subscribe(subsByDate => {
      // we sort them by date
      const subByDate = subsByDate.reduce((acc, current) => {
        return [ ...acc, ...current ]
      }, []);

      // we loop all sub classes and push to obervable to get bookings
      subByDate.forEach(sub =>{
        if(sub.date === moment().format('LL').toString()){
          this.nextClasses.push(sub);
        }
        bookingsObservables.push(this.bookingService.getBookingBySubClass(sub.$key));
      });
      // get all bookings per class toghter once the obserables complate 
      combineLatest(bookingsObservables).pipe(take(1)).subscribe(bookings =>{
        // get bookings per class
        subByDate.forEach((sub, i) =>{
          const index = this.dataDays - moment().diff(moment(sub.date, 'LL'), 'days')
          sub.confirmed_users = 0;
          sub.assisted_users = 0;
          sub.canceled_users = 0;
          sub.selected_users = 0;
          // check bookings belonging to that sub class
          if (bookings[i]){
            bookings[i].forEach(booking =>{
              // we use the status to get the users counters
              switch (booking.status) {
                case 'confirmed':
                  this.confirmed_users[index] ++
                  sub.confirmed_users++
                  break;
                case 'canceled':
                  this.canceled_users[index]++;
                  sub.canceled_users++;
                  break;
                case 'selected':
                  this.selected_users[index]++;
                  sub.selected_users++;
                  break;
                case 'assisted':
                  this.assisted_users[index]++;
                  sub.assisted_users++;
                  break;
              }
            });
          }
          // we calculate global stats for each class
          const totalBookings = sub.confirmed_users + sub.assisted_users;
          const totalSpots = sub.type === 'Indoor Cycling' ? 34 : 15;
          this.totalSpots += totalSpots;
          this.totalBookings += totalBookings;
          this.bookingAvailable += totalSpots - totalBookings;
          this.assistence += sub.assisted_users;
          this.noShow += sub.confirmed_users;
          this.canceled += sub.canceled_users;
          this.unfinishedBookings += sub.selected_users;
          this.free_spots[index] += totalSpots - totalBookings;
          this.subClasses.push(sub);
        });
        this.occupancy = ((this.assistence + this.noShow) / this.totalSpots) * 100;
        //save data
        this.home_data.createdOn = moment().toDate();
        this.home_data.confirmed_users = this.confirmed_users;
        this.home_data.totalSpots = this.totalSpots;
        this.home_data.totalBookings = this.totalBookings;
        this.home_data.canceled_users = this.canceled_users;
        this.home_data.selected_users = this.selected_users;
        this.home_data.assisted_users = this.assisted_users;
        this.home_data.free_spots = this.free_spots;
        this.home_data.bookingAvailable = this.bookingAvailable;
        this.home_data.assistence = this.assistence;
        this.home_data.noShow = this.noShow;
        this.home_data.canceled = this.canceled;
        this.home_data.usersCount = this.usersCount;
        this.home_data.newUserCount =  this.newUsersCount;
        this.home_data.new_users =  this.new_users;
        this.home_data.occupancy = this.occupancy;
        this.home_data.unfinishedBookings = this.unfinishedBookings;
        this.setBarCharts('bookingAvailable');
        this.loading = false;
        if (this.home_data.$key){
          this.statsService.updateHomeStats(this.home_data);
        } else {
          this.statsService.saveHomeStats(this.home_data);
        }
      });
    });
  }

  getUsersData(){
    this.userService.getAllUsers().pipe(take(1)).subscribe(users => {
      this.usersCount = users.length;
      users.forEach( user => {
        // Nuevos riders de la semana
        if (moment.unix(user.createdOn.seconds).toDate() >= moment().subtract(this.dataDays, 'days').toDate()) {
          const index = this.dataDays - moment().diff(moment.unix(user.createdOn.seconds), 'days');
          this.new_users[index]++;
          this.newUsersCount++;
        }
      })
    })
  }

  setBarCharts(type) {
    // Reset data
    this.barChartResults = [];
    this.chartColor = colorsMatrix[type];

    if (type === 'bookingAvailable') {
      // set graph number and color
      this.resumeNumber = this.home_data.bookingAvailable;
      this.currentStatsLabel = 'Lugares no vendidos'
      // loop the last 15 days
      this.barChartResults = this.home_data.free_spots;
      // find max to set the hight of the each bar
      this.barChartMaxValue = Math.max.apply(null, this.barChartResults);
    }

    if (type === 'allUsersCount') {
      // set graph number and color
      this.chartColor = colorsMatrix[type];
      this.resumeNumber = this.home_data.usersCount;
      this.currentStatsLabel = 'Usuarios registrados';
      this.barChartResults = this.home_data.new_users;
       // find max to set the hight of the each bar
      this.barChartMaxValue = Math.max.apply(null, this.barChartResults);
    }

    if (type === 'assistence') {
       // set graph number and color
       this.resumeNumber = this.home_data.bookingAvailable;
       this.currentStatsLabel = 'Assistencias'
       // loop the last 15 days
       this.barChartResults = this.home_data.assisted_users
       // find max to set the hight of the each bar
       this.barChartMaxValue = Math.max.apply(null, this.barChartResults);
    }

    if (type === 'noShow') {
      // set graph number and color
      this.resumeNumber = this.home_data.noShow;
      this.currentStatsLabel = 'Inasistiencias';
      // loop the last 15 days
      this.barChartResults = this.home_data.confirmed_users;
      // find max to set the hight of the each bar
      this.barChartMaxValue = Math.max.apply(null, this.barChartResults);
   }

    if (type === 'canceled') {
    // set graph number and color
    this.resumeNumber = this.home_data.canceled;
    this.currentStatsLabel = 'Cancelaciónes';
    this.barChartResults = this.home_data.canceled_users;
    // find max to set the hight of the each bar
    this.barChartMaxValue = Math.max.apply(null, this.barChartResults);
    }

    if (type === 'selected') {
    // set graph number and color
    this.resumeNumber = this.home_data.unfinishedBookings;
    this.currentStatsLabel = 'Reservaciónes no concluídas';
    // loop the last 15 days
    this.barChartResults = this.home_data.selected_users;
    // find max to set the hight of the each bar
    this.barChartMaxValue = Math.max.apply(null, this.barChartResults);
    }
  }

  getTodayClasses(){
    this.subClassService.getSubClassByDate(moment().format('LL').toString()).pipe(take(1)).subscribe(subs => {
      console.log(subs)
      this.nextClasses = subs;
    })
  }
 



  ngOnInit(){}

  array(n: number): number[] {
    return Array(n);
  }
}
