import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Inventory } from 'src/app/models/inventory.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Item } from 'src/app/models/item.model';
import { SellItemComponent } from '../sell-item/sell-item.component';
import { SalesService } from 'src/app/services/sales.service';
import { AddManufacturingComponent } from '../add-manufacturing/add-manufacturing.component';
import { ManufactureService } from 'src/app/services/manufacture.service';
import { AddSubItemComponent } from '../add-sub-item/add-sub-item.component';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  inventory : Inventory[];
  total_amount: string;
  parent_item_id: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private inventoryService: InventoryService,
    private salesService: SalesService,
    private manufactureService: ManufactureService,
    private modalService: BsModalService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.parent_item_id = this.route.snapshot.params.item_id;
    this.getInventory();
    this.refreshItems.subscribe(() => {
      this.getInventory();
    });
  }

  getInventory(){
    this.inventoryService.getInventory(this.parent_item_id)
    .subscribe((response: Response<Inventory>) => {
      this.inventory = response.items;
      this.total_amount = response.total_amount;
    });
  }

  addItem() {
    let addSubItemModalRef = this.modalService.show(AddSubItemComponent, { backdrop: 'static', keyboard: false });
    addSubItemModalRef.content.saveAndPrintSubItems.subscribe(item => {
      this.inventoryService.addSubItemInventory(item).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  moveToManufacturing(item: Item) {
    const initialState = {
      item: item
    };
    let addManufacturingModalRef = this.modalService.show(AddManufacturingComponent, { initialState, backdrop: 'static', keyboard: false });
    addManufacturingModalRef.content.addToManufacturing.subscribe(manufacture => {
      this.manufactureService.addToManufacturing(manufacture).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  sellItem(item: Item) {
    const initialState = {
      item: item
    };
    let sellItemModalRef = this.modalService.show(SellItemComponent, { initialState, backdrop: 'static', keyboard: false });
    sellItemModalRef.content.sell.subscribe(sale => {
      this.salesService.sellItem(sale).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }
}
