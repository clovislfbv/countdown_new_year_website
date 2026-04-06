import { Component, OnDestroy, OnInit } from '@angular/core';
import { AudioService } from '../audio-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-playbutton',
  imports: [],
  templateUrl: './playbutton.html',
  styleUrl: './playbutton.css'
})
export class Playbutton implements OnInit, OnDestroy {
  isPlaying: boolean = false;
  private subscription: Subscription | null = null;

  constructor(private audioService: AudioService) {}

  ngOnInit() {
    this.subscription = this.audioService.isPlaying$.subscribe((isPlaying) => {
      this.isPlaying = isPlaying;
    });
  }

  togglePlay() {
    this.audioService.togglePlay();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
