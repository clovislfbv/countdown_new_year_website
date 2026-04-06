import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { SongEventsService } from './song-events.service';
import { SongSelectionService } from './song-selection.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('countdown_new_year_website');
  private wsSubscription: Subscription | null = null;

  constructor(
    private songEvents: SongEventsService,
    private songSelection: SongSelectionService
  ) {}

  ngOnInit() {
    this.wsSubscription = this.songEvents.messages$.subscribe((event) => {
      const song = event.data;
      this.songSelection.setSelectedSong({
        title: song.title || 'Unknown Title',
        artist: 'Requested from session',
        url: song.url || '',
          thumbnail: song.thumbnail || '',
        filePath: song.original_file || undefined,
        isDownloaded: true
      });
      this.songSelection.setDownloadStatus('downloaded');
    });
  }

  ngOnDestroy() {
    this.wsSubscription?.unsubscribe();
  }
}
