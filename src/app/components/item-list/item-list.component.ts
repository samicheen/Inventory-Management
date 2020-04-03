import { Component, OnInit, TemplateRef, Output, EventEmitter } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory.service';
import { Item, InventoryResponse } from 'src/app/models/item.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AddItemModalComponent } from '../add-item-modal/add-item-modal.component';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {
  items : Item[];
  
  constructor(
    private inventoryService: InventoryService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getInventory();
  }

  addItem() {
    this.modalService.show(AddItemModalComponent);
  }

  getInventory(){
    this.inventoryService.getInventory()
    .subscribe((response: InventoryResponse) => {
      this.items = response.items;
    });
  }

}
