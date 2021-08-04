import { Pipe, PipeTransform } from '@angular/core';
import { SubClass } from './models/sub_class';
@Pipe({
  name: 'filterClassbyType'
})
// Pipe to filter bv type and not canceled
export class GetClassPipe implements PipeTransform {
  transform(classes: SubClass[], type: string): SubClass[] {
    return classes ?  classes.filter(clase => clase.type === type && !clase.canceled) : classes;
  }

}
