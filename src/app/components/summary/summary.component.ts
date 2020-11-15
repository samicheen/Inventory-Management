import { Component, OnInit } from '@angular/core';
import { SummaryService } from '../../services/summary/summary.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';
import { SummaryItem } from '../../models/summary.model';
import { Response } from '../../models/response.model';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  summary : SummaryItem[];
  total: any;
  parent_item_id: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  
  constructor(
    private summaryService: SummaryService
  ) { }

  ngOnInit(): void {
    this.getSummary();
  }

  getSummary(){
    this.summaryService.getSummary()
    .subscribe((response: Response<SummaryItem>) => {
      this.summary = response.items;
    });
  }
}
