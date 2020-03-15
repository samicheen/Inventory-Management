import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Inventory, InventoryResponse } from 'src/app/models/inventory.model';

@Component({
  selector: 'app-package-inventory',
  templateUrl: './package-inventory.component.html',
  styleUrls: ['./package-inventory.component.scss']
})
export class PackageInventoryComponent implements OnInit {
  inventory : Inventory[];

  constructor(
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.getInventory();
  }

  getInventory(){
    this.inventoryService.getInventory()
    .subscribe((response: InventoryResponse) => {
      this.inventory = response.inventory;
    });
  }

}
