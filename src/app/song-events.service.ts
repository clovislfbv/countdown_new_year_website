import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { wsUrl } from '../environments/environment';

export interface SongRequestedEvent {
  type: 'song_requested';
  data: {
    title: string;
    url: string;
    original_file: string;
    final_file: string;
    already_downloaded: boolean;
    requested_at: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SongEventsService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly reconnectDelayMs = 2000;
  private readonly messageSubject = new Subject<SongRequestedEvent>();

  public readonly messages$ = this.messageSubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'song_requested') {
          this.messageSubject.next(payload as SongRequestedEvent);
        }
      } catch (error) {
        console.error('Invalid WebSocket message payload:', error);
      }
    };

    this.socket.onclose = () => {
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      // Let onclose handle reconnect.
      this.socket?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelayMs);
  }

  ngOnDestroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }
}
