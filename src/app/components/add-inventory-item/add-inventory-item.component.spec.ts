import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddInventoryItemComponent } from './add-inventory-item.component';

describe('AddInventoryItemComponent', () => {
  let component: AddInventoryItemComponent;
  let fixture: ComponentFixture<AddInventoryItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddInventoryItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddInventoryItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
