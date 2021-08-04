import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserCreditsComponent } from './add-user-credits.component';

describe('AddUserCreditsComponent', () => {
  let component: AddUserCreditsComponent;
  let fixture: ComponentFixture<AddUserCreditsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUserCreditsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserCreditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
