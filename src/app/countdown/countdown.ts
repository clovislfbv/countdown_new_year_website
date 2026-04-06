import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiCallService } from '../api-call.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { host, port } from '../../environments/environment';
import { SongSelectionService } from '../song-selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-countdown',
  imports: [QRCodeComponent],
  templateUrl: './countdown.html',
  styleUrl: './countdown.css'
})
export class Countdown implements OnInit, OnDestroy {
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;
  song_path : string = '';
  song_url: string = '';
  song_title: string = '';
  qrUrl: string = `http://${host}:${port}/test`;
  private songSubscription: Subscription | null = null;

  constructor(
    private apiCall: ApiCallService,
    private sanitizer: DomSanitizer,
    private songSelection: SongSelectionService
  ) {
    this.calculateCountdown();
    setInterval(() => this.calculateCountdown(), 100);
  }

  ngOnInit() {
    this.songSubscription = this.songSelection.selectedSong$.subscribe((song) => {
      if (!song) {
        return;
      }

      this.song_title = song.title || this.song_title;
      this.song_url = song.url || this.song_url;
    });

    this.apiCall.getDefaultSong().subscribe({
      next: (response) => {
        console.log('Response:', response);
        if (response && response.length > 0) {
          const songData = JSON.parse(response[0]);
          this.song_path = songData.final_file;
          this.song_url = songData.url;
          this.song_title = songData.title;
        }
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  ngOnDestroy() {
    this.songSubscription?.unsubscribe();
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
