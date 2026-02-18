import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contulmeu } from './contulmeu';

describe('Contulmeu', () => {
  let component: Contulmeu;
  let fixture: ComponentFixture<Contulmeu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contulmeu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contulmeu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
