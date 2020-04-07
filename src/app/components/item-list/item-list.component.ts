import { Component, OnInit, TemplateRef, Output, EventEmitter } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Item, QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/item.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AddItemComponent } from '../add-item/add-item.component';
import { InventoryResponse } from 'src/app/models/inventory-response.model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {
  items : Item[];
  modalRef: BsModalRef;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private inventoryService: InventoryService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getInventory();
    this.refreshItems.subscribe(() => {
      this.getInventory();
    });
  }

  addItem() {
    this.modalRef = this.modalService.show(AddItemComponent);
    this.modalRef.content.saveAndPrintItems.subscribe(item => this.saveAndPrintItems(item));
  }

  saveAndPrintItems(item: Item) {
    this.inventoryService.addItem(item).subscribe(addItemResponse => {
      this.refreshItems.next(undefined);
    });
  }

  removeItem(itemNumber: string) {
    this.inventoryService.removeItem(itemNumber).subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }

  getInventory(){
    this.inventoryService.getInventory()
    .subscribe((response: InventoryResponse) => {
      this.items = response.items;
    });
  }

}
