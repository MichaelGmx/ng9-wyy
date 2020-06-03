import { Injectable, Inject } from '@angular/core';
import { ServicesModule, API_CONFIG } from './services.module';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Banner, HotTag, SongSheet } from './data-types.ts/common.types';


@Injectable({
  providedIn: ServicesModule
})
export class HomeService {

  constructor(
    private http: HttpClient,
    @Inject(API_CONFIG) private uri: string
  ) { }

  // 轮播图
  getBanners(): Observable<Banner[]> {
    return this.http.get(this.uri + 'banner')
      .pipe(map((res: {banners: Banner[]}) => res.banners));
  }

  // 热门
  getHotTags(): Observable<HotTag[]> {
    return this.http.get(this.uri + 'playlist/hot')
      .pipe(map((res: {tags: HotTag[]}) => {
        return res.tags.sort((x: HotTag, y: HotTag) => x.position - y.position).slice(0, 5);
      }));
  }

  // 个人推荐 歌单
  getPersonalSheetList(): Observable<SongSheet[]> {
    return this.http.get(this.uri + 'personalized')
      .pipe(map((res: {result: SongSheet[]}) => res.result.slice(0, 16)));
  }
}
