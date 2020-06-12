import { TestBed } from '@angular/core/testing';

import { SubItemService } from './sub-item.service';

describe('SubItemService', () => {
  let service: SubItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
