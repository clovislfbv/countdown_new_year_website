import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiCallService } from '../api-call.service';

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

  constructor(private apiCall: ApiCallService) {}

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
    let ytbUrl = "";
    
    this.apiCall.spo2ytburl(song.url).subscribe({
      next: (response) => {
        ytbUrl = response.results[0].url;

        console.log('YouTube URL:', ytbUrl);

        this.apiCall.getSong(ytbUrl).subscribe({
          next: (response) => {
            console.log('Response:', response);
          },
          error: (error) => {
            console.error('Error:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}
