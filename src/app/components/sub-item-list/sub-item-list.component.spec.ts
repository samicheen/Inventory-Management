import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubItemListComponent } from './sub-item-list.component';

describe('SubItemListComponent', () => {
  let component: SubItemListComponent;
  let fixture: ComponentFixture<SubItemListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubItemListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
