import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { apiUrl } from '../environments/environment';

export interface SongInterface {
  status: string;
  title: string;
  original_file: string;
  final_file: string;
  url: string;
}

export interface Spo2ytbResult {
  url: string,
  uri: string,
  art_url: string,
  description1: string,
  description2: string,
  description3: string,
  description4: string,
}

export interface Spo2ytbResponse {
  manual_search_link: string;
  results: Spo2ytbResult[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiCallService {
  private url = `${apiUrl}/helper.php`;

  constructor(private http: HttpClient) {}

  getSong(url: string) : Observable<string[]> {
    const formData = new FormData();
    formData.append('action', 'get_song');
    formData.append('url', url)
    
    return this.http.post<string[]>(this.url, formData, { responseType: 'json' });
  }

  getDefaultSong() : Observable<string[]> {
    const formData = new FormData();
    formData.append('action', 'get_default_song');
    
    return this.http.post<string[]>(this.url, formData, { responseType: 'json' });
  }

  searchSongs(query: string): Observable<string[]> {
    const formData = new FormData();
    formData.append('action', 'search_songs');
    formData.append('query', query);

    return this.http.post<string[]>(this.url, formData, { responseType: 'json' });
  }

  getAudioFile(filename: string): string {
    return `${apiUrl}/downloads/${filename}`;
  }

  spo2ytburl(spo_url: string): Observable<Spo2ytbResponse> {
    const formData = new FormData();
    formData.append('action', 'spo2ytb');
    formData.append('spo_url', spo_url);

    return this.http.post<Spo2ytbResponse>(this.url, formData, { responseType: 'json' });
  }
}
