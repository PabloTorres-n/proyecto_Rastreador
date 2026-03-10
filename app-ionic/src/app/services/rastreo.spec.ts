import { TestBed } from '@angular/core/testing';

import { Rastreo } from './rastreo.service.';

describe('Rastreo', () => {
  let service: Rastreo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rastreo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
