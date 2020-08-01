import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { ManufactureService } from 'src/app/services/manufacture.service';
import { Manufacture } from 'src/app/models/manufacture.model';
import { AddSubItemComponent } from '../add-sub-item/add-sub-item.component';

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
    private modalService: BsModalService
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

  addSubItem(item: Item) {
    const initialState = {
      parentItem: item
    };
    let addSubItemModalRef = this.modalService.show(AddSubItemComponent, { initialState, backdrop: 'static', keyboard: false });
    addSubItemModalRef.content.saveAndPrintSubItems.subscribe(item => {
      this.inventoryService.addSubItemInventory(item).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }
}
