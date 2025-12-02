import { Component, OnInit } from '@angular/core';
import { Item } from '../../models/item.model';
import { ItemService } from 'src/app/services/item/item.service';
import { BehaviorSubject } from 'rxjs';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from '../../models/response.model'
import { AddItemComponent } from '../add-item/add-item.component';
import { NotificationService } from '../../services/notification/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

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
    private modalService: BsModalService,
    private notificationService: NotificationService
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

  editItem(item: Item) {
    const initialState = {
      item: item
    };
    let editItemModalRef = this.modalService.show(AddItemComponent, { initialState, backdrop: 'static', keyboard: false });
    editItemModalRef.content.saveItem.subscribe(updatedItem => {
      this.itemService.updateItem(item.item_id, updatedItem).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  removeItem(item_id: string) {
    const initialState = {
      title: 'Confirm Removal',
      message: 'Are you sure you want to remove this item? This action cannot be undone if the item is not being used.',
      confirmText: 'Remove',
      cancelText: 'Cancel'
    };

    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-md'
    });

    if (modalRef.content) {
      modalRef.content.result.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.itemService.removeItem(item_id).subscribe(
            () => {
              this.refreshItems.next(undefined);
              this.notificationService.showSuccess('Item removed successfully');
            },
            (error) => {
              const errorMessage = error.error?.message || 'Unable to delete item.';
              this.notificationService.showError(errorMessage);
            }
          );
        }
      });
    }
  }
}
