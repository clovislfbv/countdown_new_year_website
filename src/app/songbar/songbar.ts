import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playbutton } from '../playbutton/playbutton';
import { SongSelectionService, SelectedSong } from '../song-selection.service';
import { AudioService } from '../audio-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-songbar',
  imports: [Playbutton, CommonModule],
  templateUrl: './songbar.html',
  styleUrl: './songbar.css'
})
export class Songbar implements OnInit, OnDestroy {
  selectedSong: SelectedSong | null = null;
  downloadStatus: string = 'idle';
  currentTime: number = 0;
  duration: number = 0;
  progressPercent: number = 0;
  isPlaying: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private songSelection: SongSelectionService, private audioService: AudioService) {}

  ngOnInit() {
    // Écouter les changements de chanson sélectionnée
    this.subscriptions.push(
      this.songSelection.selectedSong$.subscribe(song => {
        this.selectedSong = song;
      })
    );

    // Écouter les changements de statut de téléchargement
    this.subscriptions.push(
      this.songSelection.downloadStatus$.subscribe(status => {
        this.downloadStatus = status;
      })
    );

    this.subscriptions.push(
      this.audioService.currentTime$.subscribe(time => {
        this.currentTime = time;
        this.updateProgress();
      })
    );

    this.subscriptions.push(
      this.audioService.duration$.subscribe(duration => {
        this.duration = duration;
        this.updateProgress();
      })
    );

    this.subscriptions.push(
      this.audioService.isPlaying$.subscribe(isPlaying => {
        this.isPlaying = isPlaying;
      })
    );
  }

  previousTrack() {
    this.audioService.previousTrack();
  }

  skipCurrent() {
    this.audioService.skipCurrent();
  }

  seekFromClick(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    this.audioService.seekTo(percent);
  }

  private updateProgress() {
    if (!this.duration || this.duration <= 0) {
      this.progressPercent = 0;
      return;
    }

    this.progressPercent = Math.max(0, Math.min(100, (this.currentTime / this.duration) * 100));
  }

  formatTime(seconds: number) {
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }

    const rounded = Math.floor(seconds);
    const minutes = Math.floor(rounded / 60);
    const remainingSeconds = rounded % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
