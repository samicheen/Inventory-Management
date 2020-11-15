import { Component, OnInit } from '@angular/core';
import { Item } from '../../models/item.model';
import { ItemService } from 'src/app/services/item/item.service';
import { BehaviorSubject } from 'rxjs';
import { BsModalService } from 'ngx-bootstrap';
import { Response } from '../../models/response.model'
import { AddItemComponent } from '../add-item/add-item.component';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {

  items : Item[];
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private itemService: ItemService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getItems();
    this.refreshItems.subscribe(() => {
      this.getItems();
    });
  }

  getItems() {
    this.itemService.getItems()
    .subscribe((response: Response<Item>) => {
      this.items = response.items;
    });
  }

  addItem() {
    let addtemModalRef = this.modalService.show(AddItemComponent, { backdrop: 'static', keyboard: false });
    addtemModalRef.content.saveItem.subscribe(item => {
      this.itemService.addItem(item).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }
}
