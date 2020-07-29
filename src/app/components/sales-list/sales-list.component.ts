import { Component, OnInit } from '@angular/core';
import { Sale } from 'src/app/models/sale.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { SalesService } from 'src/app/services/sales.service';
import { SalesResponse } from 'src/app/models/sales-response.model';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {
  sales : Sale[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping

  constructor(private salesService: SalesService) { }

  ngOnInit(): void {
    this.getSales();
  }

  getSales(){
    this.salesService.getSales()
    .subscribe((response: SalesResponse) => {
      this.sales = response.sales;
    });
  }

}
