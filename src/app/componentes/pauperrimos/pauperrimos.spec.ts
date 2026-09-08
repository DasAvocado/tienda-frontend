import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pauperrimos } from './pauperrimos';

describe('Pauperrimos', () => {
  let component: Pauperrimos;
  let fixture: ComponentFixture<Pauperrimos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pauperrimos],
    }).compileComponents();

    fixture = TestBed.createComponent(Pauperrimos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
