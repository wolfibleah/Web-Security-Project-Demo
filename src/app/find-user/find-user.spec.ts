import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindUser } from './find-user';

describe('FindUser', () => {
  let component: FindUser;
  let fixture: ComponentFixture<FindUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
