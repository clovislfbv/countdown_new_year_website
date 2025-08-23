import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SelectedSong {
  title: string;
  artist: string;
  url: string;
  filePath?: string;
  isDownloaded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SongSelectionService {
  private selectedSongSubject = new BehaviorSubject<SelectedSong | null>(null);
  public selectedSong$ = this.selectedSongSubject.asObservable();

  private downloadStatusSubject = new BehaviorSubject<string>('idle'); // 'idle', 'downloading', 'downloaded', 'error'
  public downloadStatus$ = this.downloadStatusSubject.asObservable();

  setSelectedSong(song: SelectedSong) {
    this.selectedSongSubject.next(song);
  }

  getSelectedSong(): SelectedSong | null {
    return this.selectedSongSubject.value;
  }

  setDownloadStatus(status: string) {
    this.downloadStatusSubject.next(status);
  }

  updateSongFilePath(filePath: string) {
    const currentSong = this.getSelectedSong();
    if (currentSong) {
      this.setSelectedSong({
        ...currentSong,
        filePath: filePath,
        isDownloaded: true
      });
    }
  }
}
