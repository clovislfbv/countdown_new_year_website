import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiCallService } from '../api-call.service';

@Component({
  selector: 'app-countdown',
  imports: [],
  templateUrl: './countdown.html',
  styleUrl: './countdown.css'
})
export class Countdown implements OnInit {
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;
  song_path : string = '';
  song_url: string = '';

  constructor(private apiCall: ApiCallService, private sanitizer: DomSanitizer) {
    this.calculateCountdown();
    setInterval(() => this.calculateCountdown(), 100);
  }

  ngOnInit() {
    this.apiCall.getSong().subscribe({
      next: (response) => {
        console.log('Response:', response);
        if (response && response.length > 0) {
          const songData = JSON.parse(response[0]);
          this.song_path = songData.final_file;
          this.song_url = songData.url;
        }
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  private calculateCountdown() {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 0, 1);
    const diff = nextYear.getTime() - now.getTime();

    this.days = Math.floor(diff / (1000 * 60 * 60 * 24));
    this.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    this.seconds = Math.floor((diff % (1000 * 60)) / 1000) + 1;
    if (this.seconds === 60) {
      this.seconds = 0;
    }
  }
}
