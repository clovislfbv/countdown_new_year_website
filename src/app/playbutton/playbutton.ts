import { Component } from '@angular/core';

@Component({
  selector: 'app-playbutton',
  imports: [],
  templateUrl: './playbutton.html',
  styleUrl: './playbutton.css'
})
export class Playbutton {
  isPlaying: boolean = false; // Default state is paused (shows pause icon)

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    console.log('Button clicked! Is playing:', this.isPlaying);
    
    // Here you can add your audio control logic
    // For example:
    // if (this.isPlaying) {
    //   this.audioService.play();
    // } else {
    //   this.audioService.pause();
    // }
  }
}
