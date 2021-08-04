import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BAComponent } from './ba.component';

describe('BAComponent', () => {
  let component: BAComponent;
  let fixture: ComponentFixture<BAComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BAComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
