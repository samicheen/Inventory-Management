import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPackageModalComponent } from './add-package-modal.component';

describe('AddPackageModalComponent', () => {
  let component: AddPackageModalComponent;
  let fixture: ComponentFixture<AddPackageModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddPackageModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPackageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
