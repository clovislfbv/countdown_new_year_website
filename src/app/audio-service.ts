import { Injectable } from '@angular/core';
import { ApiCallService } from './api-call.service';
import { apiUrl } from '../environments/environment';
import { SongSelectionService } from './song-selection.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  song_path: string = '';
  audio: HTMLAudioElement | null = null;
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);

  public currentTime$ = this.currentTimeSubject.asObservable();
  public duration$ = this.durationSubject.asObservable();
  public isPlaying$ = this.isPlayingSubject.asObservable();

  constructor(private apiCall: ApiCallService, private songSelection: SongSelectionService) {
    this.songSelection.selectedSong$.subscribe((song) => {
      if (!song?.filePath) {
        return;
      }

      this.song_path = `${apiUrl}/${song.filePath}`;

      if (this.audio && !this.audio.paused) {
        this.audio.src = this.song_path;
        this.audio.load();
        this.bindAudioEvents(this.audio);
        this.audio.play().catch((error) => {
          console.error('Error auto-switching audio:', error);
        });
      } else if (this.audio) {
        this.audio.src = this.song_path;
        this.audio.load();
        this.bindAudioEvents(this.audio);
      }
    });
  }

  private bindAudioEvents(audio: HTMLAudioElement) {
    audio.ontimeupdate = () => {
      this.currentTimeSubject.next(audio.currentTime || 0);
    };

    audio.onloadedmetadata = () => {
      this.durationSubject.next(isFinite(audio.duration) ? audio.duration : 0);
    };

    audio.onplay = () => {
      this.isPlayingSubject.next(true);
    };

    audio.onpause = () => {
      this.isPlayingSubject.next(false);
    };

    audio.onended = () => {
      this.isPlayingSubject.next(false);
      this.currentTimeSubject.next(0);
    };
  }

  private createAudio(source: string) {
    this.audio = new Audio();
    this.audio.src = source;
    this.bindAudioEvents(this.audio);
    this.audio.load();
    return this.audio;
  }

  play() {
    if (!this.song_path || !this.audio) {
      this.apiCall.getDefaultSong().subscribe({
        next: (response) => {
          console.log('Response:', response);
          if (response && response.length > 0) {
            const songData = JSON.parse(response[0]);
            // Use the correct path for HTTP access to downloads folder
            this.song_path = apiUrl + "/" + songData.original_file;
            console.log('Song path:', this.song_path);
            
            // Create and configure audio AFTER getting the path
            this.createAudio(this.song_path);
            
            // Try to load and play
            this.audio?.load();
            
            // Wait for the audio to be ready before playing
            this.audio?.addEventListener('canplay', () => {
              console.log('Audio ready, starting playback');
              this.audio!.play().catch(error => {
                console.error('Error playing audio after canplay:', error);
              });
            }, { once: true });
          }
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    } else {
      // If song_path already exists, just play
      console.log('Playing existing audio:', this.song_path);
      this.audio.play().catch(error => {
        console.error('Error playing existing audio:', error);
        console.error('Audio src:', this.audio?.src);
        console.error('Audio readyState:', this.audio?.readyState);
        console.error('Audio networkState:', this.audio?.networkState);
      });
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  togglePlay() {
    if (!this.audio || this.audio.paused) {
      this.play();
      return;
    }

    this.pause();
  }

  previousTrack() {
    if (!this.audio) {
      return;
    }

    this.audio.currentTime = 0;
    this.currentTimeSubject.next(0);
    if (this.audio.paused) {
      this.audio.play().catch((error) => {
        console.error('Error restarting previous track:', error);
      });
    }
  }

  skipCurrent() {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.audio.currentTime = this.audio.duration || 0;
    this.currentTimeSubject.next(this.audio.currentTime || 0);
  }

  seekTo(percent: number) {
    if (!this.audio || !isFinite(this.audio.duration) || this.audio.duration <= 0) {
      return;
    }

    const clampedPercent = Math.max(0, Math.min(100, percent));
    this.audio.currentTime = (this.audio.duration * clampedPercent) / 100;
    this.currentTimeSubject.next(this.audio.currentTime);
  }
}
