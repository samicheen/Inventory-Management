import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Item, QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/item.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AddItemComponent } from '../add-item/add-item.component';
import { InventoryResponse } from 'src/app/models/inventory-response.model';
import { BehaviorSubject } from 'rxjs';
import { SubItemListComponent } from '../sub-item-list/sub-item-list.component';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {
  items : Item[];
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
    let addItemModalRef = this.modalService.show(AddItemComponent);
    addItemModalRef.content.saveAndPrintItems.subscribe(item => this.saveAndPrintItems(item));
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

  showSubItems(item: Item) {
    const initialState = {
      item: item
    };
    let showSubItemsModalRef = this.modalService.show(SubItemListComponent, { initialState, backdrop: 'static', keyboard: false });
    showSubItemsModalRef.content.getUpdatedItem.subscribe(updated_item => this.updateItem(updated_item));
  }

  updateItem(item: Item) {
    this.inventoryService.updateItem(item).subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }

}
