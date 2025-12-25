import { Component, OnInit } from '@angular/core';
import { SummaryService } from '../../services/summary/summary.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';
import { SummaryItem } from '../../models/summary.model';
import { Response } from '../../models/response.model';
import { GridColumn } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  summary: SummaryItem[];
  total: any;
  parent_item_id: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  columns: GridColumn[] = [];
  
  constructor(
    private summaryService: SummaryService
  ) { }

  ngOnInit(): void {
    this.initializeColumns();
    this.getSummary();
  }

  initializeColumns(): void {
    this.columns = [
      { key: 'item_name', label: 'Item Name', sortable: true, searchable: true },
      { 
        key: 'purchase_qty', 
        label: 'Purchase', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      },
      { 
        key: 'opening_stock', 
        label: 'Opening Stock', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      },
      { 
        key: 'closing_stock', 
        label: 'Closing Stock', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      },
      { 
        key: 'man_qty', 
        label: 'In Mfg', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      },
      { 
        key: 'sub_item_qty', 
        label: 'Sub Item Stock', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      },
      { 
        key: 'sales_qty', 
        label: 'Sales', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      },
      { 
        key: 'sub_sales_qty', 
        label: 'Total Sub Item Sales', 
        sortable: true,
        valueFormatter: (value: number, row: SummaryItem) => {
          return `${parseFloat(String(value)).toFixed(2)} ${this.quantityUnitToLabelMapping[row.unit] || row.unit}`;
        }
      }
    ];
  }

  getSummary(){
    this.summaryService.getSummary()
    .subscribe((response: Response<SummaryItem>) => {
      this.summary = response.items;
    });
  }

  trackByItemName(index: number, item: SummaryItem): string {
    return item.item_name || index.toString();
  }
}
