import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageInventoryComponent } from './package-inventory.component';

describe('PackageInventoryComponent', () => {
  let component: PackageInventoryComponent;
  let fixture: ComponentFixture<PackageInventoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PackageInventoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
