import { Component, OnInit } from '@angular/core';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AddPurchaseComponent } from '../add-purchase/add-purchase.component';
import { Response } from '../../models/response.model';
import { BehaviorSubject } from 'rxjs';
import { Purchase } from 'src/app/models/purchase.model';
import { PurchaseService } from '../../services/purchase/purchase.service';
import { Item } from 'src/app/models/item.model';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.scss']
})
export class PurchaseListComponent implements OnInit {
  items: Item[];
  purchases: Purchase[];
  total_amount: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private purchaseService: PurchaseService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getPurchases();
    this.refreshItems.subscribe(() => {
      this.getPurchases();
    });
  }

  addPurchase() {
    let addItemModalRef = this.modalService.show(AddPurchaseComponent, { backdrop: 'static', keyboard: false });
    addItemModalRef.content.saveAndPrintPurchases.subscribe(purchase => this.saveAndPrintPurchases(purchase));
  }

  editPurchase(purchase: Purchase) {
    const initialState = {
      purchase: purchase
    };
    let editItemModalRef = this.modalService.show(AddPurchaseComponent, { initialState, backdrop: 'static', keyboard: false });
    editItemModalRef.content.saveAndPrintPurchases.subscribe((purchase:Purchase) => {
      this.purchaseService.updatePurchase(purchase).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  saveAndPrintPurchases(purchase: Purchase) {
    this.purchaseService.addPurchase(purchase).subscribe(response => {
      this.refreshItems.next(undefined);
    });
  }

  removeItem(itemNumber: string) {
    this.purchaseService.removeItem(itemNumber).subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }

  getPurchases(){
    this.purchaseService.getPurchases()
    .subscribe((response: Response<Purchase>) => {
      this.purchases = response.items;
      this.total_amount = response.total_amount;
    });
  }
}
