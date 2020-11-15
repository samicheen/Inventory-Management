import { TestBed } from '@angular/core/testing';

import { ManufactureService } from './manufacture.service';

describe('SaleService', () => {
  let service: ManufactureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManufactureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
