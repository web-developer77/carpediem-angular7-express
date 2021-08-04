import { Component, OnInit } from '@angular/core';
import PlansJson from '../../../assets/json/plans.json';
@Component({
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit {
  packages: any[] = PlansJson;
  constructor() { }

  ngOnInit() {
  }

}
