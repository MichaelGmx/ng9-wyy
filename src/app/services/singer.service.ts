import { Injectable, Inject } from '@angular/core';
import { ServicesModule, API_CONFIG } from './services.module';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Banner, HotTag, SongSheet, Singer } from './data-types.ts/common.types';
import queryString from 'query-string';

type SingerParms = {
  offset: number;
  limit: number;
  cat?: string;
}

const defaultParams: SingerParms = {
  offset: 0,
  limit: 9,
  cat: '5001'
}

@Injectable({
  providedIn: ServicesModule
})
export class SingerService {

  constructor(
    private http: HttpClient,
    @Inject(API_CONFIG) private uri: string
  ) { }

  // 歌手列表
  getEnterSinger(args: SingerParms = defaultParams): Observable<Singer[]> {
    const params = new HttpParams({ fromString: queryString.stringify(args) })
    return this.http.get(this.uri + 'artist/list', { params })
      .pipe(map((res: {artists: Singer[]}) => res.artists));
  }

}
