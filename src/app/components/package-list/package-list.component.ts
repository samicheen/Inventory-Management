import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Inventory, InventoryResponse } from 'src/app/models/inventory.model';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.scss']
})
export class PackageListComponent implements OnInit {
  inventory : Inventory[];

  items: string[] = [
    'The first choice!',
    'And another choice for you.',
    'but wait! A third!'
  ];

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
