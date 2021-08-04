import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserClassComponent } from './add-user-class.component';

describe('AddUserClassComponent', () => {
  let component: AddUserClassComponent;
  let fixture: ComponentFixture<AddUserClassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUserClassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
