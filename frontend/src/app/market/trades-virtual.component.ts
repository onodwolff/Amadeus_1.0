import { Component, TrackByFunction } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgFor, DatePipe, NgClass } from '@angular/common';

type Trade = { ts:number; price:number; size:number; side:'buy'|'sell' };

@Component({
  selector: 'app-trades-virtual',
  standalone: true,
  imports: [ScrollingModule, NgFor, DatePipe, NgClass],
  template: `
  <cdk-virtual-scroll-viewport itemSize="28" class="vscroll">
    <div *cdkVirtualFor="let t of trades; trackBy: trackBy" [ngClass]="t.side==='buy'?'p-positive':'p-negative'">
      <span class="time">{{ t.ts | date:'HH:mm:ss' }}</span>
      <span class="price">{{ t.price }}</span>
      <span class="size">{{ t.size }}</span>
    </div>
  </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .vscroll { height: 420px; width:100%; }
    .time { color: var(--text-1); margin-right: 8px; }
    .price { min-width: 92px; display:inline-block; }
    .size  { margin-left: 8px; color: var(--text-1); }
  `]
})
export class TradesVirtualComponent {
  trades: Trade[] = [];
  trackBy: TrackByFunction<Trade> = (_, t) => t.ts;
}
