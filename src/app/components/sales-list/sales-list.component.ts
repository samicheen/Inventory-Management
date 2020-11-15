import { Component, OnInit } from '@angular/core';
import { Sale } from 'src/app/models/sale.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { SalesService } from 'src/app/services/sales/sales.service';
import { Response } from '../../models/response.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { SellItemComponent } from '../sell-item/sell-item.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {
  sales : Sale[];
  total_amount: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping
  private readonly refreshItems = new BehaviorSubject(undefined);

  constructor(
    private salesService: SalesService,
    private modalService: BsModalService
    ) { }

  ngOnInit(): void {
    this.getSales();
    this.refreshItems.subscribe(() => {
      this.getSales();
    });
  }

  getSales() {
    this.salesService.getSales()
    .subscribe((response: Response<Sale>) => {
      this.sales = response.items;
      this.total_amount = response.total_amount;
    });
  }

  addSales() {
      let sellItemModalRef = this.modalService.show(SellItemComponent, { backdrop: 'static', keyboard: false });
      sellItemModalRef.content.sell.subscribe(sale => {
        this.salesService.sellItem(sale).subscribe(() => {
          this.refreshItems.next(undefined);
        });
      });
  }

}
