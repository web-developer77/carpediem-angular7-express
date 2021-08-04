import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassUsersComponent } from './class-users.component';

describe('ClassUsersComponent', () => {
  let component: ClassUsersComponent;
  let fixture: ComponentFixture<ClassUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClassUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
