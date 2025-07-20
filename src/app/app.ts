import { Component, signal } from '@angular/core';
import { Countdown } from "./countdown/countdown";
import { Songbar } from './songbar/songbar';

@Component({
  selector: 'app-root',
  imports: [Countdown, Songbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('countdown_new_year_website');
}
