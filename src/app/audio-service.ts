import { Injectable, OnInit } from '@angular/core';
import { ApiCallService } from './api-call.service';
import { apiUrl } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  song_path: string = '';
  audio: HTMLAudioElement | null = null;

  constructor(private apiCall: ApiCallService) {}

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
            this.audio = new Audio();
            this.audio.src = this.song_path;
            
            // Try to load and play
            this.audio.load();
            
            // Wait for the audio to be ready before playing
            this.audio.addEventListener('canplay', () => {
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
}
