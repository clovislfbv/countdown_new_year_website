import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiCallService } from '../api-call.service';
import { SongSelectionService } from '../song-selection.service';

@Component({
  selector: 'app-sessions',
  imports: [CommonModule],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css'
})
export class Sessions implements OnDestroy {
  searchResults: any[] = [];
  isSearching: boolean = false;
  searchTimeout: any;

  constructor(private apiCall: ApiCallService, private songSelection: SongSelectionService) {}

  onSearch(event: KeyboardEvent) {
    const query = (event.target as HTMLInputElement).value.trim();
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (query.length < 2) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 500);
  }

  private performSearch(query: string) {
    this.isSearching = true;
    this.apiCall.searchSongs(query).subscribe({
      next: (response) => {
        console.log('Raw response:', response);
        console.log('Response[0]:', response[0]);
        console.log('Type of response[0]:', typeof response[0]);
        
        try {
          // Si response[0] est une string JSON, on la parse
          let parsedData;
          if (typeof response[0] === 'string') {
            parsedData = JSON.parse(response[0]);
          } else {
            parsedData = response[0];
          }
          
          console.log('Parsed data:', parsedData);
          
          // Vérifier si parsedData est un array ou contient un array
          if (Array.isArray(parsedData)) {
            this.searchResults = parsedData;
          } else if (parsedData && Array.isArray(parsedData.results)) {
            this.searchResults = parsedData.results;
          } else if (parsedData && Array.isArray(parsedData.songs)) {
            this.searchResults = parsedData.songs;
          } else {
            console.warn('Unexpected data format:', parsedData);
            this.searchResults = [];
          }
          
          console.log('Final search results:', this.searchResults);
        } catch (error) {
          console.error('Error parsing search results:', error);
          this.searchResults = [];
        }
        
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching songs:', error);
        this.isSearching = false;
        this.searchResults = [];
      }
    });
  }

  selectSong(song: any) {
    console.log('Selected song:', song);
    
    // Informer le service qu'une chanson a été sélectionnée
    this.songSelection.setSelectedSong({
      title: song.name || song.title || 'Unknown Title',
      artist: song.artists?.[0]?.name || song.artist || 'Unknown Artist',
      url: song.external_urls?.spotify || song.url || ''
    });
    
    // Commencer le téléchargement
    this.songSelection.setDownloadStatus('downloading');
    
    let ytbUrl = "";
    
    this.apiCall.spo2ytburl(song.external_urls?.spotify || song.url).subscribe({
      next: (response) => {
        ytbUrl = response.results[0].url;
        console.log('YouTube URL:', ytbUrl);

        this.apiCall.getSong(ytbUrl).subscribe({
          next: (response) => {
            console.log('Download Response:', response);
            if (response && response.length > 0) {
              const songData = JSON.parse(response[0]);
              // Mettre à jour le service avec le chemin du fichier
              this.songSelection.updateSongFilePath(songData.original_file);
              this.songSelection.setDownloadStatus('downloaded');
            }
          },
          error: (error) => {
            console.error('Error downloading song:', error);
            this.songSelection.setDownloadStatus('error');
          }
        });
      },
      error: (error) => {
        console.error('Error converting Spotify to YouTube:', error);
        this.songSelection.setDownloadStatus('error');
      }
    });
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}
