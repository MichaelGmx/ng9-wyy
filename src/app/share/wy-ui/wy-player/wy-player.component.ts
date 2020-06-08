import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AppStoreModule } from 'src/app/store';
import { Store, select } from '@ngrx/store';
import { getSongList, getPlayList, getCurrentIndex, getPlayMode, getCurrentSong } from 'src/app/store/selectors/player.selector';
import { Song } from 'src/app/services/data-types.ts/common.types';
import { SetCurrentIndex } from 'src/app/store/actions/player.action';

@Component({
  selector: 'app-wy-player',
  templateUrl: './wy-player.component.html',
  styleUrls: ['./wy-player.component.less']
})
export class WyPlayerComponent implements OnInit {
  @ViewChild('audio', {static: true}) private audio: ElementRef;
  private audioEl: HTMLAudioElement;

  sliderValue = 35;
  bufferOffset = 70;

  songList: Song[];
  playList: Song[];
  currentIndex: number;
  currentSong: Song;

  duration: number;
  currentTime: number;

  // 播放状态
  playing = false;

  // 是否可以播放
  songReady = false;

  constructor(
    private store$: Store<AppStoreModule>
  ) {
    const appStore$ = this.store$.pipe(select('player'));
    // appStore$.pipe(select(getSongList)).subscribe(list => {
    //   console.log('getSongList: ', list);
    // });
    // appStore$.pipe(select(getPlayList)).subscribe(list => {
    //   console.log('getPlayList: ', list);
    // });
    // appStore$.pipe(select(getCurrentIndex)).subscribe(index => {
    //   console.log('getCurrentIndex: ', index);
    // });

    const stateArr = [{
      type: getSongList,
      cb: list => this.watchList(list, 'songList')
    }, {
      type: getPlayList,
      cb: list => this.watchList(list, 'playList')
    }, {
      type: getCurrentIndex,
      cb: index => this.watchCurrentIndex(index)
    }, {
      type: getPlayMode,
      cb: mode => this.watchPlayMode(mode)
    }, {
      type: getCurrentSong,
      cb: song => this.watchCurrentSong(song)
    }];
    stateArr.forEach(item => {
      appStore$.pipe(select(item.type)).subscribe(item.cb);
    })
  }

  ngOnInit(): void {
    this.audioEl = this.audio.nativeElement;
  }

  private watchList(list: Song[], type: string) {
    this[type] = list;
  }

  private watchCurrentIndex(index: number) {
    this.currentIndex = index;
  }

  private watchPlayMode(mode: string) {
    console.log('mode: ', mode);
  }

  private watchCurrentSong(song: Song) {
    if (song) {
      this.currentSong = song;
      this.duration = song.dt / 1000;  // 单位转换为秒
      console.log('song: ', song);
    }
  }

  // 播放/暂停
  onToggle() {
    if (!this.currentSong) {
      if (!this.playList.length) {
        this.store$.dispatch(SetCurrentIndex({ currentIndex: 0 }));
        this.songReady = false;
      }
    } else {
      if (this.songReady) {
        this.playing = !this.playing;
        if (this.playing) {
          this.audioEl.play();
        } else {
          this.audioEl.pause();
        }
      }
    }
  }

  // 上一曲
  onPrev(index: number) {
    if (!this.songReady) return;
    if (this.playList.length === 1) {
      this.loop();
    } else {
      const newIndex = index <= 0 ? this.playList.length - 1 : index;
      this.updateIndex(newIndex);
    }
  }

  // 下一曲
  onNext(index: number) {
    if (!this.songReady) return;
    if (this.playList.length === 1) {
      this.loop();
    } else {
      const newIndex = index >= this.playList.length ? 0 : index;
      this.updateIndex(newIndex);
    }
  }

  // 单曲循环
  private loop() {
    this.audioEl.currentTime = 0;
    this.play();
  }

  private updateIndex(index: number) {
    this.store$.dispatch(SetCurrentIndex({ currentIndex: index }));
    this.songReady = false;
  }

  onCanplay() {
    this.songReady = true;
    this.play();
  }

  onTimeUpdate(e: Event) {
    this.currentTime = (<HTMLAudioElement>e.target).currentTime;
  }

  private play() {
    this.audioEl.play();
    this.playing = true;
  }

  get picUrl() {
    return this.currentSong ? this.currentSong.al.picUrl : '//s1.music.126.net/style/web2/img/default/default_album.jpg';
  }
}
