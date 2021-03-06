import { Component, OnInit, ViewChild } from '@angular/core';
import { Banner, HotTag, SongSheet, Singer } from 'src/app/services/data-types.ts/common.types';
import { NzCarouselComponent } from 'ng-zorro-antd';
// import { HomeService } from 'src/app/services/home.service';
// import { SingerService } from 'src/app/services/singer.service';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { SheetService } from 'src/app/services/sheet.service';
import { Store, select } from '@ngrx/store';
import { AppStoreModule } from 'src/app/store';
import { BatchActionsService } from 'src/app/store/batch-actions.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
  carouselActiveIndex = 0;
  banners: Banner[];
  hotTags: HotTag[];
  songSheetList: SongSheet[];
  singers: Singer[];

  @ViewChild(NzCarouselComponent, { static: true }) private nzCarousel: NzCarouselComponent;

  constructor(
    // private homeService: HomeService,
    // private singerService: SingerService,
    private route: ActivatedRoute,
    private sheetService: SheetService,
    private batchActionService: BatchActionsService
  ) {
    // this.getBanners();
    // this.getHotTags();
    // this.getPersonalizedSheetList();
    // this.getEnterSingers();
    this.route.data.pipe(map(res => res.homeDatas)).subscribe(([banners, hotTags, songSheetList, singers]) => {
      this.banners = banners;
      this.hotTags = hotTags;
      this.songSheetList = songSheetList;
      this.singers = singers;
    });

    
  }

  ngOnInit(): void {
  }

  onBeforeChange({ to }) {
    this.carouselActiveIndex = to;
  }

  onChangeSlide(type: string) {
    this.nzCarousel[type]();
  }

  onPlaySheet(id: number) {
    this.sheetService.playSheet(id).subscribe(list => {
      this.batchActionService.selectPlayList({ list, index: 0 });
    });
  }

  // private getBanners() {
  //   this.homeService.getBanners().subscribe(banners => {
  //     this.banners = banners;
  //   });
  // }

  // private getHotTags() {
  //   this.homeService.getHotTags().subscribe(tags => {
  //     this.hotTags = tags;
  //   });
  // }

  // private getPersonalizedSheetList() {
  //   this.homeService.getPersonalSheetList().subscribe(sheet => {
  //     this.songSheetList = sheet;
  //   });
  // }

  // private getEnterSingers() {
  //   this.singerService.getEnterSinger().subscribe(singer => {
  //     this.singers = singer;
  //   });
  // }
}
