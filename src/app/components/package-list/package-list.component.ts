import { Component, OnInit, TemplateRef, Output, EventEmitter } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Inventory, InventoryResponse } from 'src/app/models/inventory.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AddPackageModalComponent } from '../add-package-modal/add-package-modal.component';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.scss']
})
export class PackageListComponent implements OnInit {
  inventory : Inventory[];
  
  constructor(
    private inventoryService: InventoryService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getInventory();
  }

  addPackage() {
    this.modalService.show(AddPackageModalComponent);
  }

  getInventory(){
    this.inventoryService.getInventory()
    .subscribe((response: InventoryResponse) => {
      this.inventory = response.inventory;
    });
  }

}
