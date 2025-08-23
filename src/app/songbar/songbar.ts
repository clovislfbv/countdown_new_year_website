import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playbutton } from '../playbutton/playbutton';
import { SongSelectionService, SelectedSong } from '../song-selection.service';
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
  private subscriptions: Subscription[] = [];

  constructor(private songSelection: SongSelectionService) {}

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
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
