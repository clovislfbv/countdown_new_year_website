import { Component } from '@angular/core';
import { Songbar } from '../songbar/songbar';
import { Countdown } from '../countdown/countdown';

@Component({
  selector: 'app-home',
  imports: [Songbar, Countdown],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
