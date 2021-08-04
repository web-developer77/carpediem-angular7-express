import { Component, OnInit, ViewChild } from '@angular/core';
import moment from 'moment';
import { PurchaseService } from 'src/app/shared/services/purchase.service';
import { UserService } from 'src/app/shared/services/user.service';
import { BookingService } from 'src/app/shared/services/booking.service';
import { ExportService } from "src/app/shared/services/export.service"
import { Purchase } from 'src/app/shared/models/purchase';
import { User } from 'src/app/shared/models/user';
import { take } from 'rxjs/operators';

const colorsMatrix = {
  new: '#a77f57',
  renew: '#3c75f1',
  canceled: '#EA5455',
  next: '#28C76F'
}

const dict = {
  "Paquete primera clase": 0,
  "Paquete 1 clase": 1,
  "Paquete 5 clases": 2,
  "Paquete 10 clases": 3,
  "Paquete 25 clases": 4,
  "Paquete 50 clases": 5
}

const type = {
  "Indoor Cycling": 0,
  "Yoga": 1,
  "Funcional": 2,
}

@Component({
  selector: 'app-ba',
  templateUrl: './ba.component.html',
  styleUrls: ['./ba.component.scss']
})


export class BAComponent implements OnInit {
  todayIncome = 0;
  totalIncome = 0;
  activeCount = 0;
  assistenceDay: number[] = [0, 0, 0, 0, 0, 0, 0];
  assistenceType: number[] = [0, 0, 0];
  assistenceInstructor = {};
  incomePackage: number[] = [0, 0, 0, 0, 0, 0];
  packagesTotal = 0;
  incomeChartMax = 0;
  incomeChart: number[] = [];
  birthdays: User[] = [];
  inactiveUsers: User[] = [];
  membershipsChartMax = 0;
  membershipsChart: number[] = [];
  membershipsChartColor = '';
  membershipsChartType = 'new';
  newMemberships: number[] = [];
  newTotal = 0;
  renewMemberships: number[] = [];
  renewTotal = 0;
  canceledMemberships: number[] = [];
  canceledTotal = 0;
  nextMemberships: number[] = [];
  nextTotal = 0;
  totalMemberships = 0;
  loading = true;
  daysInMonth: string[] = [];
  monthSelected = '';
  maxDate = new Date();
  exporting = false;
  exported: string;
  @ViewChild('monthPicker') monthPicker: any;

  constructor(
    private purchaseService: PurchaseService,
    private userService: UserService,
    private bookingService: BookingService,
    private exportService: ExportService,
  ) {

  }

  ngOnInit() {
    // one time calulcations
    moment.locale('es');
    this.monthSelected = moment().format("MMMM-YYYY")
    this.getTotalMemberships();
    this.getActiveUsers();
    this.getInactiveUsers();
    this.getRenovations();
    // calculations for every month
    this.setDaysInMonth();
    this.getMemberships(moment())
    this.getPurchases(moment());
    this.getBirthdays(moment());
    this.getBookings(moment());
  }

  //function for export as xlsx
  exportAsExcel(event) {
    this.exported = event
    this.exporting = true
    const temp = [];
    this.exportService.getCollection(event).subscribe(data => {
      data.forEach((doc) => {
        temp.push(doc.data());
      })
      this.exportService.downloadFile(temp, temp[0], event);
      this.exporting = false;
    });

  }
  // function to handle month selection
  selectMonth(event) {
    this.monthSelected = moment(event).format('MMMM-YYYY');
    const date = moment(event)
    this.monthPicker.close();
    this.setDaysInMonth();
    this.getMemberships(date);
    this.getPurchases(date);
    this.getBirthdays(date);
    this.getBookings(date);
  }

  // function to get the days of a month in a array
  setDaysInMonth() {
    this.daysInMonth = [];
    // if its current month only show until today
    const limit = this.monthSelected === moment().format("MMMM-YYYY") ? moment().daysInMonth() : moment(this.monthSelected, 'MMMM-YYYY').daysInMonth();
    for (let i = 0; i < limit; i++) {
      this.daysInMonth.push(moment().startOf('month').add(i, 'days').format('LL').toString())
      this.incomeChart.push(0);
    }
  }

  getPurchases(month) {
    this.packagesTotal = 0;
    this.incomePackage = [0, 0, 0, 0, 0, 0];
    this.totalIncome = 0;

    // get all  getPurchases in the month that where paid in mostrador
    this.purchaseService.getPurchasessByMonth(month.startOf('month').toDate(), month.endOf('month').toDate())
      .pipe(take(1)).subscribe((purchases: Purchase[]) => {
        purchases.forEach(purchase => {
          const date = moment.unix(purchase.createdOn.seconds);
          // add the ammount to the date corresponding to the day of the month - 1 index 
          this.incomeChart[date.date() - 1] += purchase.amount;
          this.incomePackage[dict[purchase.package]]++;
          this.totalIncome += purchase.amount;
          this.packagesTotal++;
          if (moment().isSame(date, 'day')) this.todayIncome += purchase.amount;
        })
        this.incomeChartMax = Math.max.apply(null, this.incomeChart);
      })
  }


  getBirthdays(month) {
    this.userService.getUsersByBirthday(month.month()).pipe(take(1)).subscribe((users: User[]) => {
      this.birthdays = users.sort((a, b) => {
        const day1 = parseInt(a.born.split(' ')[0]);
        const day2 = parseInt(b.born.split(' ')[0]);
        return day1 - day2;
      });
    })
  }

  getBookings(month) {
    this.assistenceInstructor = {};
    this.assistenceDay = [0, 0, 0, 0, 0, 0, 0];
    this.assistenceType = [0, 0, 0];
    this.bookingService.getBookingByDateRange(month.startOf('month').toDate(), month.endOf('month').toDate())
      .pipe(take(1)).subscribe(bookings => {
        bookings.forEach(booking => {
          // for each booking in the month we check if the person assisted
          if (booking.status === 'assisted' || booking.status === 'confirmed') {
            // we add it to the day count and type count
            this.assistenceDay[moment.unix(booking.dateObj.seconds).day()]++;
            this.assistenceType[type[booking.type]]++;
            // make structure to calculate assistence per instructor
            if (!this.assistenceInstructor[booking.instructor.$key]) {
              this.assistenceInstructor[booking.instructor.$key] = {
                class_count: [booking.sub_class],
                total_spots: booking.type == 'Indoor Cycling' ? 34 : 15,
                assistence: 1,
                name: booking.instructor.name
              }
            } else {
              // we add the assistence and teh sub_class key
              this.assistenceInstructor[booking.instructor.$key].assistence++;
              // if the sub_class still not in the array we add 34 spots on the class depending the type
              if (!this.assistenceInstructor[booking.instructor.$key].class_count.includes(booking.sub_class)) {
                this.assistenceInstructor[booking.instructor.$key].class_count.push(booking.sub_class)
                this.assistenceInstructor[booking.instructor.$key].total_spots += booking.type == 'Indoor Cycling' ? 34 : 15;
              }
            }
          }
        })
      })
  }

  getActiveUsers() {
    this.userService.getActive(moment().subtract(15, 'days').toDate()).pipe(take(1)).subscribe(users => {
      this.activeCount = users.length
    })
  }

  getInactiveUsers() {
    this.userService.getInactive(moment().subtract(15, 'days').toDate()).pipe(take(1)).subscribe(users => {
      this.inactiveUsers = users as User[];
    })
  }

  getMemberships(month) {
    this.newMemberships = Array(this.daysInMonth.length).fill(0);
    this.renewMemberships = Array(this.daysInMonth.length).fill(0);

    this.purchaseService.getPurchasessBySubscription(month.startOf('month').toDate()).pipe(take(1)).subscribe((memberships: Purchase[]) => {
      memberships.forEach(membership => {
        if (membership.subscription_count == 1) {
          this.newMemberships[moment.unix(membership.createdOn.seconds).date()]++;
          this.newTotal++;
        } else if (membership.subscription_count > 1) {
          this.renewMemberships[moment.unix(membership.createdOn.seconds).date()]++;
          this.renewTotal++;
        }
      })
      this.selectMemberships(this.membershipsChartType);
    })
  }

  getRenovations() {
    this.nextMemberships = Array(this.daysInMonth.length).fill(0);
    // Get renovations by date 
    this.purchaseService.getRenovations(moment().toDate()).pipe(take(1)).subscribe((nexts: Purchase[]) => {
      this.nextTotal = nexts.length;
    })
  }

  getTotalMemberships() {
    this.userService.getSubscriptions().pipe(take(1)).subscribe(users => {
      this.totalMemberships = users.length;
    })
  }

  selectMemberships(type) {
    this.membershipsChartType = type;

    switch (type) {
      case 'new':
        this.membershipsChart = this.newMemberships;
        break;
      case 'renew':
        this.membershipsChart = this.renewMemberships;
        break;
      case 'canceled':
        this.membershipsChart = this.canceledMemberships;
        break;
    }
    console.log(this.membershipsChart)
    this.membershipsChartMax = Math.max.apply(null, this.membershipsChart);
    this.membershipsChartColor = colorsMatrix[type]
    this.loading = false;
  }
}
