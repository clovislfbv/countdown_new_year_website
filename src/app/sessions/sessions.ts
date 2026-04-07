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
  private searchRequestId = 0;

  constructor(private apiCall: ApiCallService, private songSelection: SongSelectionService) {}

  get spotifySearchResults(): any[] {
    return this.searchResults.filter((item) => item?.kind === 'spotify');
  }

  get youtubeSearchResults(): any[] {
    return this.searchResults.filter((item) => item?.kind === 'youtube');
  }

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

  private handleDirectLink(link: string, previewSong?: { title?: string; artist?: string; url?: string; thumbnail?: string; }) {
    this.isSearching = true;
    this.searchResults = [];

    if (this.isSpotifyLink(link)) {
      this.downloadFromSpotify(link, previewSong);
      return;
    }

    if (this.isYouTubeLink(link)) {
      this.downloadFromYouTube(link, previewSong);
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

  private downloadFromSpotify(link: string, previewSong?: { title?: string; artist?: string; url?: string; thumbnail?: string; }) {
    this.songSelection.setSelectedSong({
      title: 'Loading...',
      artist: 'Downloading from Spotify...',
      url: link,
      thumbnail: previewSong?.thumbnail || ''
    });
    this.songSelection.setDownloadStatus('downloading');

    this.apiCall.getSong(link).subscribe({
      next: (response) => {
        console.log('Spotify download response:', response);
        if (response && response.length > 0) {
          const songData = JSON.parse(response[0]);
          this.songSelection.setSelectedSong({
            title: songData.title || 'Unknown Title',
            artist: songData.artist || previewSong?.artist || 'Imported from Spotify',
            url: songData.url || link,
            thumbnail: songData.thumbnail || previewSong?.thumbnail || '',
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
        console.error('Error downloading song from Spotify:', error);
        this.songSelection.setDownloadStatus('error');
        this.isSearching = false;
      }
    });
  }

  private downloadFromYouTube(youtubeUrl: string, previewSong?: { title?: string; artist?: string; url?: string; thumbnail?: string; }) {
    this.songSelection.setSelectedSong({
      title: previewSong?.title || 'Loading...',
      artist: previewSong?.artist || 'Resolving link...',
      url: previewSong?.url || youtubeUrl,
      thumbnail: previewSong?.thumbnail || ''
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
            thumbnail: songData.thumbnail || previewSong?.thumbnail || '',
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
    const requestId = ++this.searchRequestId;
    this.isSearching = true;
    this.searchResults = [];

    this.apiCall.searchSpotifySongs(query).subscribe({
      next: (response) => {
        if (requestId !== this.searchRequestId) {
          return;
        }

        const spotifyResults = this.extractResults(response, 'spotify');
        this.searchResults = spotifyResults;

        this.apiCall.searchYoutubeSongs(query).subscribe({
          next: (youtubeResponse) => {
            if (requestId !== this.searchRequestId) {
              return;
            }

            const youtubeResults = this.extractResults(youtubeResponse, 'youtube');
            this.searchResults = [...spotifyResults, ...youtubeResults];
            this.isSearching = false;
          },
          error: (error) => {
            console.error('Error searching YouTube songs:', error);
            if (requestId !== this.searchRequestId) {
              return;
            }

            this.isSearching = false;
          }
        });
      },
      error: (error) => {
        console.error('Error searching Spotify songs:', error);
        if (requestId !== this.searchRequestId) {
          return;
        }

        this.searchResults = [];

        this.apiCall.searchYoutubeSongs(query).subscribe({
          next: (youtubeResponse) => {
            if (requestId !== this.searchRequestId) {
              return;
            }

            this.searchResults = this.extractResults(youtubeResponse, 'youtube');
            this.isSearching = false;
          },
          error: (youtubeError) => {
            console.error('Error searching YouTube songs:', youtubeError);
            if (requestId !== this.searchRequestId) {
              return;
            }

            this.searchResults = [];
            this.isSearching = false;
          }
        });
      }
    });
  }

  private extractResults(response: any, expectedKind: 'spotify' | 'youtube'): any[] {
    if (!response || response.length === 0) {
      return [];
    }

    try {
      const parsedData = typeof response[0] === 'string' ? JSON.parse(response[0]) : response[0];
      const rawResults = Array.isArray(parsedData)
        ? parsedData
        : (Array.isArray(parsedData?.results) ? parsedData.results : []);

      return rawResults.filter((item: any) => item?.kind === expectedKind);
    } catch (error) {
      console.error(`Error parsing ${expectedKind} search results:`, error);
      return [];
    }
  }

  selectSong(song: any) {
    console.log('Selected song:', song);

    if (song?.kind === 'spotify' || song?.kind === 'youtube') {
      if (song.kind === 'spotify') {
        this.downloadFromSpotify(song.value || song.url || '', song);
      } else {
        this.downloadFromYouTube(song.value || song.url || '', song);
      }
      return;
    }
    
    // Informer le service qu'une chanson a été sélectionnée
    this.songSelection.setSelectedSong({
      title: song.name || song.title || 'Unknown Title',
      artist: song.artists?.[0]?.name || song.artist || 'Unknown Artist',
      url: song.external_urls?.spotify || song.url || '',
      thumbnail: song.album_image || song.thumbnail || ''
    });
    
    // Commencer le téléchargement
    this.songSelection.setDownloadStatus('downloading');
    
    this.downloadFromSpotify(song.external_urls?.spotify || song.url, {
      title: song.name || song.title || 'Unknown Title',
      artist: song.artists?.[0]?.name || song.artist || 'Unknown Artist',
      url: song.external_urls?.spotify || song.url || '',
      thumbnail: song.album_image || song.thumbnail || ''
    });
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}
