import { Component } from '@angular/core';
import { AudioService } from '../audio-service';

@Component({
  selector: 'app-playbutton',
  imports: [],
  templateUrl: './playbutton.html',
  styleUrl: './playbutton.css'
})
export class Playbutton {
  isPlaying: boolean = false; // Default state is paused (shows pause icon)

  constructor(private audioService: AudioService) {}

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    console.log('Button clicked! Is playing:', this.isPlaying);
    
    // Here you can add your audio control logic
    // For example:
    if (this.isPlaying) {
      this.audioService.play();
    } else {
      this.audioService.pause();
    }
  }
}
