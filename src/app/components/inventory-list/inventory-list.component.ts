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
  inventory: InventoryItem[];
  inventoryParameters: Map<string, any> = new Map();
  total: any;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private inventoryService: InventoryService,
    private salesService: SalesService,
    private manufactureService: ManufactureService,
    private modalService: BsModalService,
    public route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.inventoryParameters.set('parent_item_id', this.route.snapshot.params.item_id);
    this.getInventory();
    this.refreshItems.subscribe(() => {
      this.getInventory();
    });
  }

  getInventory(){
    this.inventoryService.getInventory(this.inventoryParameters)
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

  moveToManufacturing(invItem: InventoryItem) {
    // Pass the inventory item to manufacturing form (to send raw material to manufacturing)
    const initialState = {
      item: invItem.item,
      barcode: invItem.barcode, // Pass barcode for tracking
      available_quantity: invItem.closing_stock, // Available quantity from inventory
      rate: typeof invItem.rate === 'string' ? parseFloat(invItem.rate) : (invItem.rate || 0) // Convert rate to number
    };
    let addManufacturingModalRef = this.modalService.show(AddManufacturingComponent, { initialState, backdrop: 'static', keyboard: false });
    addManufacturingModalRef.content.addToManufacturing.subscribe((manufacture: any) => {
      // Add source_barcode to manufacture data
      manufacture.source_barcode = invItem.barcode;
      this.manufactureService.addToManufacturing(manufacture).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  sellItem(invItem: InventoryItem) {
    const initialState = {
      item: invItem.item,
      barcode: invItem.barcode || invItem.source_barcode, // Pass barcode for tracking
      availableQuantity: invItem.closing_stock, // Pass available quantity
      rate: typeof invItem.rate === 'string' ? parseFloat(invItem.rate) : (invItem.rate || 0) // Pass rate
    };
    let sellItemModalRef = this.modalService.show(SellItemComponent, { initialState, backdrop: 'static', keyboard: false });
    sellItemModalRef.content.sell.subscribe(sale => {
      this.salesService.sellItem(sale).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  onSelect(data) {
    this.inventoryParameters.set('retrieve_sub_items', data.heading === 'Sub Items' ? 1 : 0);
    this.getInventory();
  }

  copyBarcode(barcode: string): void {
    // Copy barcode to clipboard
    navigator.clipboard.writeText(barcode).then(() => {
      alert('Barcode copied: ' + barcode + '\n\nPaste it in the header scanner to test!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = barcode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Barcode copied: ' + barcode + '\n\nPaste it in the header scanner to test!');
    });
  }
}
