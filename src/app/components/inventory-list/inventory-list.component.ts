import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { InventoryItem } from 'src/app/models/inventory-item.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Item } from 'src/app/models/item.model';
import { SellItemComponent } from '../sell-item/sell-item.component';
import { SalesService } from 'src/app/services/sales/sales.service';
import { AddManufacturingComponent } from '../add-manufacturing/add-manufacturing.component';
import { ManufactureService } from 'src/app/services/manufacture/manufacture.service';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  inventory : InventoryItem[];
  total: any;
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
    .subscribe((response: Response<InventoryItem>) => {
      this.inventory = response.items;
      this.total = response.total;
    });
  }

  addItem() {
    let addInventoryItemModalRef = this.modalService.show(AddInventoryItemComponent, { backdrop: 'static', keyboard: false });
    addInventoryItemModalRef.content.saveAndPrintInventoryItems.subscribe(item => {
      item.opening_stock = item.closing_stock;
      item.opening_amount = item.closing_amount;
      this.inventoryService.addInventoryItem(item).subscribe(() => {
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
