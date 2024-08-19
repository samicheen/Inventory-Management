import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ManufacturingListComponent } from './manufacturing-list.component';

describe('ManufacturingListComponent', () => {
  let component: ManufacturingListComponent;
  let fixture: ComponentFixture<ManufacturingListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManufacturingListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManufacturingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
