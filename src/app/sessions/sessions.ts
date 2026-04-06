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
  private directLinkRequestId = 0;

  constructor(private apiCall: ApiCallService, private songSelection: SongSelectionService) {}

  onSearch(event: Event) {
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

    if (this.isDirectLink(query)) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.fetchLinkMetadata(query);
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 500);
  }

  private async fetchLinkMetadata(link: string) {
    const requestId = ++this.directLinkRequestId;
    this.isSearching = true;
    this.searchResults = [];

    try {
      const suggestion = this.isSpotifyLink(link)
        ? await this.fetchSpotifyLinkMetadata(link)
        : await this.fetchYouTubeLinkMetadata(link);

      if (requestId !== this.directLinkRequestId) {
        return;
      }

      this.searchResults = [suggestion];
    } catch (error) {
      console.error('Error fetching pasted link metadata:', error);
      if (requestId !== this.directLinkRequestId) {
        return;
      }

      this.searchResults = [this.buildFallbackLinkSuggestion(link)];
    } finally {
      if (requestId === this.directLinkRequestId) {
        this.isSearching = false;
      }
    }
  }

  private buildFallbackLinkSuggestion(link: string) {
    return {
      title: this.isSpotifyLink(link) ? 'Spotify link pasted' : 'YouTube link pasted',
      artist: 'Click to continue',
      thumbnail: '',
      value: link,
      kind: this.isSpotifyLink(link) ? ('spotify' as const) : ('youtube' as const)
    };
  }

  private async fetchSpotifyLinkMetadata(link: string) {
    const normalizedLink = this.normalizeSpotifyLink(link);
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(normalizedLink)}`);
    if (!response.ok) {
      throw new Error(`Spotify oEmbed request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      title: data.title || 'Spotify track',
      artist: data.author_name || 'Spotify',
      thumbnail: data.thumbnail_url || '',
      value: normalizedLink,
      kind: 'spotify' as const
    };
  }

  private async fetchYouTubeLinkMetadata(link: string) {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`);
    if (!response.ok) {
      throw new Error(`YouTube oEmbed request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      title: data.title || 'YouTube video',
      artist: data.author_name || 'YouTube',
      thumbnail: data.thumbnail_url || '',
      value: link,
      kind: 'youtube' as const
    };
  }

  private normalizeSpotifyLink(link: string) {
    if (link.startsWith('spotify:')) {
      const parts = link.split(':');
      if (parts.length === 3) {
        return `https://open.spotify.com/${parts[1]}/${parts[2]}`;
      }
    }

    return link;
  }

  private isDirectLink(value: string): boolean {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|open\.spotify\.com|spotify:)/i.test(value);
  }

  private handleDirectLink(link: string) {
    this.isSearching = true;
    this.searchResults = [];

    if (this.isSpotifyLink(link)) {
      this.convertSpotifyLink(link);
      return;
    }

    if (this.isYouTubeLink(link)) {
      this.downloadFromYouTube(link);
      return;
    }

    this.isSearching = false;
  }

  private isSpotifyLink(value: string): boolean {
    return /^(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify:)/i.test(value);
  }

  private isYouTubeLink(value: string): boolean {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(value);
  }

  private convertSpotifyLink(link: string) {
    this.songSelection.setDownloadStatus('downloading');

    this.apiCall.spo2ytburl(link).subscribe({
      next: (response) => {
        const youtubeUrl = response.results?.[0]?.url;
        if (!youtubeUrl) {
          this.songSelection.setDownloadStatus('error');
          this.isSearching = false;
          return;
        }

        this.downloadFromYouTube(youtubeUrl);
      },
      error: (error) => {
        console.error('Error converting Spotify link:', error);
        this.songSelection.setDownloadStatus('error');
        this.isSearching = false;
      }
    });
  }

  private downloadFromYouTube(youtubeUrl: string) {
    this.songSelection.setSelectedSong({
      title: 'Loading...',
      artist: 'Resolving link...',
      url: youtubeUrl
    });
    this.songSelection.setDownloadStatus('downloading');

    this.apiCall.getSong(youtubeUrl).subscribe({
      next: (response) => {
        console.log('Download Response:', response);
        if (response && response.length > 0) {
          const songData = JSON.parse(response[0]);
          this.songSelection.setSelectedSong({
            title: songData.title || 'Unknown Title',
            artist: 'Imported from link',
            url: songData.url || youtubeUrl,
            filePath: songData.original_file,
            isDownloaded: true
          });
          this.songSelection.updateSongFilePath(songData.original_file);
          this.songSelection.setDownloadStatus('downloaded');
        } else {
          this.songSelection.setDownloadStatus('error');
        }

        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error downloading song from link:', error);
        this.songSelection.setDownloadStatus('error');
        this.isSearching = false;
      }
    });
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

    if (song?.kind === 'spotify' || song?.kind === 'youtube') {
      this.handleDirectLink(song.value || song.url || '');
      return;
    }
    
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
