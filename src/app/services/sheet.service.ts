import { Injectable, Inject } from '@angular/core';
import { ServicesModule, API_CONFIG } from './services.module';
import { Observable } from 'rxjs';
import { map, pluck, switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SongSheet, Song } from './data-types.ts/common.types';
import { SongService } from './song.service';


@Injectable({
  providedIn: ServicesModule
})
export class SheetService {

  constructor(
    @Inject(API_CONFIG) private uri: string,
    private http: HttpClient,
    private songService: SongService
  ) { }

  // 歌单详情
  getSongSheetDetail(id: number): Observable<SongSheet> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get(this.uri + 'playlist/detail', { params })
      .pipe(map((res: {playlist: SongSheet}) => res.playlist));
  }

  playSheet(id: number): Observable<Song[]> {
    return this.getSongSheetDetail(id)
      .pipe(pluck('tracks'), switchMap(tracks => this.songService.getSongList(tracks) ))
  }
}
