import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Item, QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/item.model';
import { SubItem } from 'src/app/models/sub-item.model';
import { BehaviorSubject, Subject } from 'rxjs';
import { SubItemService } from 'src/app/services/sub-item.service';
import { SubItemResponse } from 'src/app/models/sub-item-response.model';
import { AddSubItemComponent } from '../add-sub-item/add-sub-item.component';
import { SellItemComponent } from '../sell-item/sell-item.component';
import { SellItem } from 'src/app/models/sell-item.model';

@Component({
  selector: 'app-sub-item-list',
  templateUrl: './sub-item-list.component.html',
  styleUrls: ['./sub-item-list.component.scss']
})
export class SubItemListComponent implements OnInit {
  @Input() item: Item;
  subItems: SubItem[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  getUpdatedItem: Subject<Item>;

  constructor(
    private subItemService: SubItemService,
    public modalRef: BsModalRef,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.getUpdatedItem = new Subject();
    this.getSubItems(this.item.item_number);
    this.refreshItems.subscribe(() => {
      this.getSubItems(this.item.item_number);
    });
  }

  getSubItems(item_id: string) {
    this.subItemService.getSubItems(item_id)
    .subscribe((response: SubItemResponse) => {
      this.subItems = response.sub_items;
    });
  }

  addSubItem() {
    let addSubItemModalRef = this.modalService.show(AddSubItemComponent, { backdrop: 'static', keyboard: false });
    addSubItemModalRef.content.saveAndPrintSubItems.subscribe(sub_item => this.saveAndPrintSubItems(sub_item));
  }

  saveAndPrintSubItems(sub_item: SubItem) {
    sub_item.item_id = this.item.item_number;
    sub_item.grade = this.item.grade;
    this.subItemService.addSubItem(sub_item).subscribe(addSubItemResponse => {
      this.refreshItems.next(undefined);
      let updated_item = { ...this.item };
      updated_item.quantity.value = updated_item.quantity.value - sub_item.quantity.value;
      this.getUpdatedItem.next(updated_item);
    });
  }

  removeSubItem(id: string) {
    this.subItemService.removeItem(id)
    .subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }

  sellSubItem(sub_item: SubItem) {
    const initialState = {
      sub_item: sub_item
    };
    let sellItemModalRef = this.modalService.show(SellItemComponent, { initialState, backdrop: 'static', keyboard: false });
    sellItemModalRef.content.sell.subscribe(item => {
      this.sellItem(sub_item, item);
    });
  }

  sellItem(subItem: SubItem, item: SellItem) {
    this.subItemService.sellItem(item)
    .subscribe(() => {
      let updatedSubItem = { ...subItem };
      updatedSubItem.quantity.value = updatedSubItem.quantity.value - item.quantity.value;
      this.updateSubItem(updatedSubItem);
    });
  }

  updateSubItem(item: SubItem) {
    this.subItemService.updateSubItem(item)
    .subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }
}
