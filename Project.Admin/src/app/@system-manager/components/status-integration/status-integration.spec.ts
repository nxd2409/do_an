import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusIntegration } from './status-integration';

describe('StatusIntegration', () => {
  let component: StatusIntegration;
  let fixture: ComponentFixture<StatusIntegration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusIntegration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusIntegration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
