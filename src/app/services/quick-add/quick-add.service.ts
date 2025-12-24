import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ItemService } from '../item/item.service';
import { PartyService } from '../party/party.service';
import { NotificationService } from '../notification/notification.service';
import { AddItemComponent } from '../../components/add-item/add-item.component';
import { AddPartyComponent } from '../../components/add-party/add-party.component';
import { Item } from '../../models/item.model';
import { Party } from '../../models/party.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QuickAddService {

  constructor(
    private modalService: BsModalService,
    private itemService: ItemService,
    private partyService: PartyService,
    private notificationService: NotificationService
  ) { }

  /**
   * Open quick-add modal for item
   * @returns Observable that emits the newly added item when successful
   */
  openAddItemModal(): Observable<Item> {
    return new Observable(observer => {
      const addItemModalRef = this.modalService.show(AddItemComponent, { 
        backdrop: 'static', 
        keyboard: false,
        class: 'modal-sm'
      });
      
      if (addItemModalRef.content) {
        addItemModalRef.content.saveItem.subscribe((item: Item) => {
          this.itemService.addItem(item).subscribe(
            (response) => {
              this.notificationService.showSuccess('Item added successfully');
              // Refresh items list and find the newly added item
              this.itemService.getItems().subscribe((response) => {
                const newItem = response.items.find((i: Item) => 
                  i.name === item.name && 
                  i.grade === item.grade && 
                  i.size === item.size
                );
                if (newItem) {
                  observer.next(newItem);
                  observer.complete();
                } else {
                  observer.error('Newly added item not found');
                }
              });
            },
            (error) => {
              this.notificationService.showError('Error adding item: ' + (error.error?.message || error.message));
              observer.error(error);
            }
          );
        });
      }
    });
  }

  /**
   * Open quick-add modal for item (with sub-items filter)
   * @param subItemsOnly If true, only loads sub-items after adding
   * @returns Observable that emits the newly added item when successful
   */
  openAddItemModalWithFilter(subItemsOnly: boolean = false): Observable<Item> {
    return new Observable(observer => {
      const addItemModalRef = this.modalService.show(AddItemComponent, { 
        backdrop: 'static', 
        keyboard: false,
        class: 'modal-sm'
      });
      
      if (addItemModalRef.content) {
        addItemModalRef.content.saveItem.subscribe((item: Item) => {
          this.itemService.addItem(item).subscribe(
            (response) => {
              this.notificationService.showSuccess('Item added successfully');
              // Refresh items list with filter
              this.itemService.getItems(subItemsOnly).subscribe((response) => {
                const newItem = response.items.find((i: Item) => 
                  i.name === item.name && 
                  i.grade === item.grade && 
                  i.size === item.size
                );
                if (newItem) {
                  observer.next(newItem);
                  observer.complete();
                } else {
                  observer.error('Newly added item not found');
                }
              });
            },
            (error) => {
              this.notificationService.showError('Error adding item: ' + (error.error?.message || error.message));
              observer.error(error);
            }
          );
        });
      }
    });
  }

  /**
   * Open quick-add modal for party (vendor or customer)
   * @param type 'vendor' or 'customer'
   * @returns Observable that emits the newly added party when successful
   */
  openAddPartyModal(type: 'vendor' | 'customer'): Observable<Party> {
    return new Observable(observer => {
      const initialState = { type: type };
      const addPartyModalRef = this.modalService.show(AddPartyComponent, { 
        initialState, 
        backdrop: 'static', 
        keyboard: false,
        class: 'modal-sm'
      });
      
      if (addPartyModalRef.content) {
        addPartyModalRef.content.saveParty.subscribe((party: Party) => {
          this.partyService.addParty(party).subscribe(
            (response) => {
              this.notificationService.showSuccess(
                type === 'customer' ? 'Customer added successfully' : 'Vendor added successfully'
              );
              // Refresh parties list and find the newly added party
              this.partyService.getParties(type).subscribe((response) => {
                const newParty = response.items.find((p: Party) => p.name === party.name);
                if (newParty) {
                  observer.next(newParty);
                  observer.complete();
                } else {
                  observer.error('Newly added party not found');
                }
              });
            },
            (error) => {
              this.notificationService.showError(
                `Error adding ${type}: ` + (error.error?.message || error.message)
              );
              observer.error(error);
            }
          );
        });
      }
    });
  }
}

