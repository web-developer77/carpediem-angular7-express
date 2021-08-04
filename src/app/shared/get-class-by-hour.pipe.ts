import { Pipe, PipeTransform } from '@angular/core';
import { SubClass } from './models/sub_class';
@Pipe({
  name: 'orderByHour'
})
// Pipe to order by start time
export class OrderByHourPipe implements PipeTransform {
  transform(classes: SubClass[]): SubClass[] {
    if (classes){
      return classes.sort((a, b) => {
      const time1: string[] = a.start.split(':', 2);
      const daytime1: string[] = time1[1].split(' ', 2);
      let hour1: number = parseInt(time1[0])
      const minutes1: number = parseInt(daytime1[0]) / 100;
      hour1 += minutes1;
      if (daytime1[1] === 'pm' && hour1 !== 12) {
        hour1 += 12;
      }
      const time2: string[] = b.start.split(':', 2);
      const daytime2: string[] = time2[1].split(' ', 2);
      let hour2: number = parseInt(time2[0])
      const minutes2: number = parseInt(daytime2[0]) / 100;
      hour2 += minutes2;
      if (daytime2[1] === 'pm' && hour2 !== 12) {
        hour2 += 12;
      }
      return hour1 - hour2;
    });
    }
  }
}
