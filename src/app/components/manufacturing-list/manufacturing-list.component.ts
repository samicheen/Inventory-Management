import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { ManufactureService } from 'src/app/services/manufacture/manufacture.service';
import { Manufacture } from 'src/app/models/manufacture.model';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { ItemService } from 'src/app/services/item/item.service';

@Component({
  selector: 'app-manufacturing-list',
  templateUrl: './manufacturing-list.component.html',
  styleUrls: ['./manufacturing-list.component.scss']
})
export class ManufacturingListComponent implements OnInit {
  manufactures : Manufacture[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private manufactureService: ManufactureService,
    private inventoryService: InventoryService,
    private modalService: BsModalService,
    private itemService: ItemService
  ) { }

  ngOnInit(): void {
    this.getManufacturingItems();
    this.refreshItems.subscribe(() => {
      this.getManufacturingItems();
    });
  }

  getManufacturingItems(){
    this.manufactureService.getManufacturingItems()
    .subscribe((response: Response<Manufacture>) => {
      this.manufactures = response.items;
    });
  }

  addSubItem(manufacture: Manufacture) {
    const initialState = {
      parentItem: manufacture.item,
      manufactureEntry: manufacture // Pass full manufacturing entry with source_barcode, rate, etc.
    };
    let addSubItemModalRef = this.modalService.show(AddInventoryItemComponent, { initialState, backdrop: 'static', keyboard: false });
    addSubItemModalRef.content.saveAndPrintInventoryItems.subscribe(item => {
      this.inventoryService.addInventoryItem(item).subscribe((response: any) => {
        this.refreshItems.next(undefined);
        
        // Open print labels modal if barcode is returned
        if (response && response.barcode) {
          // Get the sub-item details (the item that was created, not the parent)
          this.itemService.getItems(true).subscribe((itemsResponse: any) => {
            const createdItem = itemsResponse.items.find((i: Item) => i.item_id === item.item.item_id);
            const itemName = createdItem 
              ? `${createdItem.name} Grade: ${createdItem.grade} Size: ${createdItem.size}`
              : 'Item';
            
            // Extract quantity value (handle both Quantity object and number)
            const quantityValue = typeof item.closing_stock === 'object' 
              ? (item.closing_stock?.value || 0)
              : (item.closing_stock || 0);
            const quantityUnit = typeof item.closing_stock === 'object'
              ? (item.closing_stock?.unit || 'KG')
              : 'KG';
            
            const printInitialState = {
              barcode: response.barcode,
              itemName: itemName,
              quantity: quantityValue,
              unit: quantityUnit,
              labelCount: 1
            };
            
            this.modalService.show(PrintLabelsComponent, { 
              initialState: printInitialState, 
              backdrop: 'static', 
              keyboard: false,
              class: 'modal-lg'
            });
          });
        }
      });
    });
  }
}
