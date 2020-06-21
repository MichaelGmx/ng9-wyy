import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter, Inject } from '@angular/core';
import BScroll from '@better-scroll/core';
import ScrollBar from '@better-scroll/scroll-bar';
import MouseWheel from '@better-scroll/mouse-wheel';
import { timer } from 'rxjs';
import { WINDOW } from 'src/app/services/services.module';

BScroll.use(ScrollBar);
BScroll.use(MouseWheel);


@Component({
  selector: 'app-wy-scroll',
  template: `
    <div class="wy-scroll" #wrap>
      <ng-content></ng-content>
    </div>
  `,
  styles: [` .wy-scroll{ width: 100%; height: 100%; overflow: hidden; } `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WyScrollComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() data: any[];
  @Input() refreshDelay = 50;

  @Output() private onScrollEnd = new EventEmitter<number>();

  @ViewChild('wrap', {static: true}) private wrapRef: ElementRef;

  private bs: BScroll;

  constructor(
    readonly el: ElementRef,
    @Inject(WINDOW) private win: Window
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    console.log('OffsetHeight: ', this.wrapRef.nativeElement.OffsetHeight);
    this.bs = new BScroll(this.wrapRef.nativeElement, {
      scrollbar: {
        interactive: true    // 设置ScrollBar可以交互
      },
      mouseWheel: {}
    });
    this.bs.on('scrollEnd', ({ y }) => this.onScrollEnd.emit(y));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.refreshScroll();
    }
  }

  scrollToElement(...args) {
    this.bs.scrollToElement.apply(this.bs, args);
  }

  scrollTo(...args) {
    this.bs.scrollToElement.apply(this.bs, args);
  }

  private refresh() {
    this.bs.refresh();
  }

  refreshScroll() {
    timer(this.refreshDelay).subscribe(() => {
      this.refresh();
    });
    // this.win.setTimeout(() => {
    //   this.refresh();
    // }, this.refreshDelay);
  }
}
