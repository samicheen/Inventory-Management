import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Inventory } from 'src/app/models/inventory.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject } from 'rxjs';
import { SubItemListComponent } from '../sub-item-list/sub-item-list.component';
import { ActivatedRoute } from '@angular/router';
import { Item } from 'src/app/models/item.model';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  inventory : Inventory[];
  total_amount: string;
  item_id: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private inventoryService: InventoryService,
    private modalService: BsModalService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.item_id = this.route.snapshot.params.item_id;
    this.getInventory();
    this.refreshItems.subscribe(() => {
      this.getInventory();
    });
  }

  removeItem(itemNumber: string) {
    this.inventoryService.removeItem(itemNumber).subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }

  getInventory(){
    this.inventoryService.getInventory(this.item_id)
    .subscribe((response: Response<Inventory>) => {
      this.inventory = response.items;
      this.total_amount = response.total_amount;
    });
  }

  showSubItems(inventory: Inventory) {
    const initialState = {
      inventory: inventory
    };
    let showSubItemsModalRef = this.modalService.show(SubItemListComponent, { initialState, backdrop: 'static', keyboard: false });
    //showSubItemsModalRef.content.getUpdatedItem.subscribe(updated_item => this.updateItem(updated_item));
  }

  moveToManufacturing(item: Item) {

  }

}
