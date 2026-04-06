import { Component } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { Songbar } from '../songbar/songbar';
import { Countdown } from '../countdown/countdown';
import { host, port } from '../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [Songbar, Countdown, QRCodeComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  qrUrl: string = `http://${host}:${port}/test`;

}
