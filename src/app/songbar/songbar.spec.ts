import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Songbar } from './songbar';
import { Playbutton } from '../playbutton/playbutton';

describe('Songbar', () => {
  let component: Songbar;
  let fixture: ComponentFixture<Songbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Songbar, Playbutton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Songbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
