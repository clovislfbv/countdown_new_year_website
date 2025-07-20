import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Playbutton } from './playbutton';

describe('Playbutton', () => {
  let component: Playbutton;
  let fixture: ComponentFixture<Playbutton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Playbutton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Playbutton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
