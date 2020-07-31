import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddManufacturingComponent } from './add-manufacturing.component';

describe('AddManufacturingComponent', () => {
  let component: AddManufacturingComponent;
  let fixture: ComponentFixture<AddManufacturingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddManufacturingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddManufacturingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
