import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarperidersComponent } from './carperiders.component';

describe('CarperidersComponent', () => {
  let component: CarperidersComponent;
  let fixture: ComponentFixture<CarperidersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarperidersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarperidersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
