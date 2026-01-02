import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-shimmer',
  imports: [CommonModule],
  templateUrl: './table-shimmer.component.html',
  styleUrl: './table-shimmer.component.css'
})
export class TableShimmerComponent {
  @Input() rows: number = 5;
  @Input() columns: number = 5;

  get rowArray(): number[] {
    return Array(this.rows).fill(0);
  }

  get columnArray(): number[] {
    return Array(this.columns).fill(0);
  }
}
