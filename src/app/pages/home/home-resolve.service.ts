import { Injectable }             from '@angular/core';
import { Resolve }                from '@angular/router';
import { SingerService } from 'src/app/services/singer.service';
import { HomeService } from 'src/app/services/home.service';
import { Banner, HotTag, SongSheet, Singer } from 'src/app/services/data-types.ts/common.types';
import { Observable, forkJoin } from 'rxjs';
import { take, first } from 'rxjs/internal/operators';


type HomeDataType = [Banner[], HotTag[], SongSheet[], Singer[]]

@Injectable({
  providedIn: 'root',
})
export class HomeResolverService implements Resolve<HomeDataType> {
  constructor(
    private homeService: HomeService,
    private singerService: SingerService
  ) {}

  resolve(): Observable<HomeDataType> {
    return forkJoin([
      this.homeService.getBanners(),
      this.homeService.getHotTags(),
      this.homeService.getPersonalSheetList(),
      this.singerService.getEnterSinger()
    // ]).pipe(take(1));
    ]).pipe(first());
  }
}