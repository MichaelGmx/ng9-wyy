import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter, ViewChildren, QueryList, Inject } from '@angular/core';
import { Song } from 'src/app/services/data-types.ts/common.types';
import { WyScrollComponent } from '../wy-scroll/wy-scroll.component';
import { findIndex } from 'src/app/utils/array';
import { timer } from 'rxjs';
import { WINDOW } from 'src/app/services/services.module';
import { SongService } from 'src/app/services/song.service';
import { WyLyric, BaseLyricLine } from './wy-lyric';

@Component({
  selector: 'app-wy-player-panel',
  templateUrl: './wy-player-panel.component.html',
  styleUrls: ['./wy-player-panel.component.less']
})
export class WyPlayerPanelComponent implements OnInit, OnChanges {
  @Input() playing: boolean;
  @Input() songList: Song[];
  @Input() currentSong: Song;
  @Input() show: boolean;

  @Output() onClose = new EventEmitter<void>();
  @Output() onChangeSong = new EventEmitter<Song>();
  @Output() onDeleteSong = new EventEmitter<Song>();
  @Output() onClearSong = new EventEmitter<void>();

  scrollY = 0;

  currentIndex: number;
  currentLyric: BaseLyricLine[];
  currentLineNum: number;

  private lyric: WyLyric;
  private lyricRefs: NodeList;
  private startLine = 2;

  @ViewChildren(WyScrollComponent) private wyScroll: QueryList<WyScrollComponent>;

  constructor(
    // @Inject(WINDOW) private win: Window,
    private songService: SongService
  ) { }
  
  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playing']) {
      if (!changes['playing'].firstChange) {
        this.lyric && this.lyric.togglePlay(this.playing);
      }
    }

    if (changes['songList']) {
      this.updateCurrentIndex();
    }
    if (changes['currentSong']) {
      if (this.currentSong) {
        this.updateCurrentIndex();
        this.updateLyric();
        if (this.show) {
          this.scrollToCurrent();
        }
      } else {
        this.resetLyric();
      }
    }
    if (changes['show']) {
      if (!changes['show'].firstChange && this.show) {
        // console.log('wyScroll: ', this.wyScroll);
        this.wyScroll.first.refreshScroll();
        this.wyScroll.last.refreshScroll();
        timer(80).subscribe(() => {
          if (this.currentSong) {
            this.scrollToCurrent(0);
          }
          if (this.lyricRefs) {
            this.scrollToLyric(0);
          }
        });
        // this.win.setTimeout(() => {
        //   if (this.currentSong) {
        //     this.scrollToCurrent(0);
        //   }
        // }, 80);
      }
    }
  }

  private updateCurrentIndex() {
    this.currentIndex = findIndex(this.songList, this.currentSong);
  }

  // 更新歌词
  private updateLyric() {
    this.resetLyric();
    this.songService.getLyric(this.currentSong.id).subscribe(res => {
      this.lyric = new WyLyric(res);
      this.currentLyric = this.lyric.lines;
      // console.log('currentLyric:', this.currentLyric);
      this.startLine = res.tlyric ? 1 : 2;
      this.handleLyric();
      this.wyScroll.last.scrollTo(0, 0);

      if (this.playing) {
        this.lyric.play();
      }
    });
  }

  private handleLyric() {
    this.lyric.handler.subscribe(({ lineNum }) => {
      if (!this.lyricRefs) {
        this.lyricRefs = this.wyScroll.last.el.nativeElement.querySelectorAll('ul li');
        console.log('lyricRefs :', this.lyricRefs);
      }

      if (this.lyricRefs.length) {
        this.currentLineNum = lineNum;
        if (lineNum > this.startLine) {
          this.scrollToLyric(300);
        } else {
          this.wyScroll.last.scrollTo(0, 0);
        }
      }
    });
  }

  private resetLyric() {
    if (this.lyric) {
      this.lyric.stop();
      this.lyric = null;
      this.currentLyric = [];
      this.currentLineNum = 0;
      this.lyricRefs = null;
    }
  }

  seekLyric(time: number) {
    if (this.lyric) {
      this.lyric.seek(time);
    }
  }

  // 滚动到当前歌曲
  private scrollToCurrent(speed = 300) {
    const songListRefs = this.wyScroll.first.el.nativeElement.querySelectorAll('ul li');
    if (songListRefs.length) {
      const currentLi = <HTMLElement>songListRefs[this.currentIndex || 0];
      const offsetTop = currentLi.offsetTop;
      const liHeight = currentLi.offsetHeight;
      console.log('offsetTop: ', offsetTop);
      console.log('scrollY: ', this.scrollY);
      if ((offsetTop - Math.abs(this.scrollY) > liHeight * 5) || (offsetTop < Math.abs(this.scrollY))) {     // 向下/向上 超出可视范围
        this.wyScroll.first.scrollToElement(currentLi, speed, false, false);    // 使用better-scroll的方法实现
      }
    }
  }
  
  private scrollToLyric(speed = 300) {
    const targetLine = this.lyricRefs[this.currentLineNum - this.startLine];
    if (targetLine) {
      this.wyScroll.last.scrollToElement(targetLine, speed, false, false);
    }
  }
}
