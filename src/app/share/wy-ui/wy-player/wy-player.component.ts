import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { AppStoreModule } from 'src/app/store';
import { Store, select } from '@ngrx/store';
import { getSongList, getPlayList, getCurrentIndex, getPlayMode, getCurrentSong } from 'src/app/store/selectors/player.selector';
import { Song } from 'src/app/services/data-types.ts/common.types';
import { SetCurrentIndex, SetPlayMode, SetPlayList, SetSongList } from 'src/app/store/actions/player.action';
import { Subscription, fromEvent } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { PlayMode } from './play-type';
import { shuffle, findIndex } from 'src/app/utils/array';
import { WyPlayerPanelComponent } from './wy-player-panel/wy-player-panel.component';
import { NzModalService } from 'ng-zorro-antd';
import { BatchActionsService } from 'src/app/store/batch-actions.service';

const modeTypes: PlayMode[] = [
  { type: 'loop', label: '循环' },
  { type: 'random', label: '随机' },
  { type: 'singleLoop', label: '单曲循环' }
];

@Component({
  selector: 'app-wy-player',
  templateUrl: './wy-player.component.html',
  styleUrls: ['./wy-player.component.less']
})
export class WyPlayerComponent implements OnInit {
  @ViewChild('audio', {static: true}) private audio: ElementRef;
  @ViewChild(WyPlayerPanelComponent, {static: false}) private playerPanel: WyPlayerPanelComponent;
  private audioEl: HTMLAudioElement;

  percent = 0;
  bufferPercent = 0;

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

  // 音量
  volume = 60;

  // 是否显示音量面板
  showVolumnPanel = false;

  // 是否显示列表面板
  showPanel = false;

  // 是否绑定document click事件
  bindFlag = false;

  private winClick: Subscription;

  // 当前模式
  currentMode: PlayMode;
  modeCount = 0;

  constructor(
    private store$: Store<AppStoreModule>,
    @Inject(DOCUMENT) private doc: Document,
    private nzModalServe: NzModalService,
    private batchActionsService: BatchActionsService
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

  private watchPlayMode(mode: PlayMode) {
    console.log('mode: ', mode);
    this.currentMode = mode;
    if (this.songList) {
      let list = this.songList.slice();
      if (mode.type === 'random') {
        list = shuffle(this.songList);
      }
      this.updateCurrentIndex(list, this.currentSong);
      this.store$.dispatch(SetPlayList({ playList: list }));
    }
  }

  private watchCurrentSong(song: Song) {
    if (song) {
      this.currentSong = song;
      this.duration = song.dt / 1000;  // 单位转换为秒
      console.log('song: ', song);
    }
  }

  private updateCurrentIndex(list: Song[], song: Song) {
    // const newIndex = list.findIndex(item => item.id === song.id);
    const newIndex = findIndex(list, song);
    this.store$.dispatch(SetCurrentIndex({ currentIndex: newIndex }));
  }

  // 改变模式
  changeMode() {
    this.store$.dispatch(SetPlayMode({ playMode: modeTypes[++this.modeCount % 3] }));
  }

  onClickOutSide() {
    console.log('onClickOutSide');
    this.showVolumnPanel = false;
    this.showPanel = false;
    this.bindFlag = false;
  }

  onPercentChange(per: number) {
    if (this.currentSong) {
      const currentTime = this.duration * (per / 100);
      this.audioEl.currentTime = currentTime;
      if (this.playerPanel) {
        this.playerPanel.seekLyric(currentTime * 1000);
      }
    }
  }

  // 控制音量
  onVolumeChange(per: number) {
    this.audioEl.volume = per / 100;
  }

  // 控制音量面板
  toggleVolPanel(evt: MouseEvent) {
    // evt.stopPropagation();   // 在下面方法实现了
    this.togglePanel('showVolumnPanel');
  }

  // 控制列表面板
  toggleListPanel() {
    if (this.songList.length) {
      this.togglePanel('showPanel'); 
    }
  }
  

  togglePanel(type: string) {
    this[type] = !this[type];
    this.bindFlag = (this.showVolumnPanel || this.showPanel);
  }

  private unbindDocumentClickListener() {
    if (this.winClick) {
      this.winClick.unsubscribe();
      this.winClick = null;
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

  // 播放结束
  onEnded() {
    this.playing = false;
    if (this.currentMode.type === 'singleLoop') {
      this.loop();
    } else {
      this.onNext(this.currentIndex + 1);
    }
  }

  // 单曲循环（从开始播放即可）
  private loop() {
    this.audioEl.currentTime = 0;      // 播放时间重置
    this.play();                       // 重新播放
    if (this.playerPanel) {
      this.playerPanel.seekLyric(0);   // 歌词重置
    }
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
    this.percent = (this.currentTime / this.duration) * 100;
    const buffered = this.audioEl.buffered;
    if (buffered.length && this.bufferPercent < 100) {
      this.bufferPercent = (buffered.end(0) / this.duration) * 100;
    }
  }

  private play() {
    this.audioEl.play();
    this.playing = true;
  }

  get picUrl() {
    return this.currentSong ? this.currentSong.al.picUrl : '//s1.music.126.net/style/web2/img/default/default_album.jpg';
  }

  // 改变歌曲
  onChangeSong(song: Song) {
    this.updateCurrentIndex(this.playList, song);
  }

  // 删除歌曲
  onDeleteSong(song: Song) {
    this.batchActionsService.deleteSong(song);
  }

  // 清空歌曲
  onClearSong() {
    this.nzModalServe.confirm({
      nzTitle: '确认清空列表？',
      nzOnOk: () => {
        this.batchActionsService.clearSong();
      }
    });
  }
}
