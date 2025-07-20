import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { port } from '../environments/environment';

export interface SongInterface {
  status: string;
  title: string;
  original_file: string;
  final_file: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiCallService {
  private url = `http://localhost:${port}/helper.php`;

  constructor(private http: HttpClient) {}

  getSong() : Observable<string[]> {
    const formData = new FormData();
    formData.append('action', 'get_song');
    
    return this.http.post<string[]>(this.url, formData, { responseType: 'json' });
  }

  getAudioFile(filename: string): string {
    return `http://localhost:3000/downloads/${filename}`;
  }
}
