import { Component, OnInit } from '@angular/core';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AddPurchaseComponent } from '../add-purchase/add-purchase.component';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { Response } from '../../models/response.model';
import { BehaviorSubject } from 'rxjs';
import { Purchase } from 'src/app/models/purchase.model';
import { PurchaseService } from '../../services/purchase/purchase.service';
import { ItemService } from '../../services/item/item.service';
import { Item } from 'src/app/models/item.model';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.scss']
})
export class PurchaseListComponent implements OnInit {
  items: Item[];
  purchases: Purchase[] = []; // Initialize as empty array
  total_amount: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private purchaseService: PurchaseService,
    private modalService: BsModalService,
    private itemService: ItemService
  ) { }

  ngOnInit(): void {
    this.getPurchases();
    this.refreshItems.subscribe(() => {
      this.getPurchases();
    });
  }

  addPurchase() {
    let addItemModalRef = this.modalService.show(AddPurchaseComponent, { backdrop: 'static', keyboard: false });
    addItemModalRef.content.saveAndPrintPurchases.subscribe(purchase => this.saveAndPrintPurchases(purchase));
  }

  editPurchase(purchase: Purchase) {
    const initialState = {
      purchase: purchase
    };
    let editItemModalRef = this.modalService.show(AddPurchaseComponent, { initialState, backdrop: 'static', keyboard: false });
    editItemModalRef.content.saveAndPrintPurchases.subscribe((purchase: any) => {
      if (purchase.purchase_id) {
        // Update existing purchase
        this.purchaseService.updatePurchase(purchase).subscribe({
          next: () => {
            this.refreshItems.next(undefined);
          },
          error: (error) => {
            console.error('Error updating purchase:', error);
            // Show backend validation error to user
            const errorMessage = error.error?.message || error.message || 'Unable to update purchase.';
            alert(errorMessage);
            this.refreshItems.next(undefined);
          }
        });
      } else {
        // Add new purchase
        this.saveAndPrintPurchases(purchase);
      }
    });
  }

  saveAndPrintPurchases(purchase: any) {
    this.purchaseService.addPurchase(purchase).subscribe({
      next: (response: any) => {
        console.log('Purchase response:', response); // Debug
        this.refreshItems.next(undefined);
        
        // Open print labels modal if barcode is returned
        if (response && response.barcode) {
          console.log('Opening print labels with barcode:', response.barcode); // Debug
          // Get item details - check if item object exists, otherwise find from items array
          let itemName = '';
          if (purchase.item && purchase.item.name) {
            // Item details already in purchase object
            itemName = `${purchase.item.name} Grade: ${purchase.item.grade || ''} Size: ${purchase.item.size || ''}`;
          } else if (purchase.item_id && this.items) {
            // Find item from items array using item_id
            const item = this.items.find(i => i.item_id === purchase.item_id);
            if (item) {
              itemName = `${item.name || ''} Grade: ${item.grade || ''} Size: ${item.size || ''}`;
            }
          }
          
          const initialState = {
            barcode: response.barcode,
            itemName: itemName || 'Item',
            quantity: purchase.quantity?.value || 0,
            unit: purchase.quantity?.unit || 'KG',
            labelCount: 1 // Default to 1, user can change
          };
          
          this.modalService.show(PrintLabelsComponent, { 
            initialState, 
            backdrop: 'static', 
            keyboard: false,
            class: 'modal-lg'
          });
        }
      },
      error: (error) => {
        console.error('Error adding purchase:', error);
        // Still refresh to show current state
        this.refreshItems.next(undefined);
      }
    });
  }

  removeItem(itemNumber: string) {
    this.purchaseService.removeItem(itemNumber).subscribe(() => {
      this.refreshItems.next(undefined);
    });
  }

  getPurchases(){
    this.purchaseService.getPurchases()
    .subscribe((response: Response<Purchase>) => {
      console.log('Purchases response:', response); // Debug
      this.purchases = response.items || [];
      console.log('Purchases array:', this.purchases); // Debug - check if barcode is present
      if (this.purchases && this.purchases.length > 0) {
        console.log('First purchase barcode:', this.purchases[0].barcode); // Debug
        console.log('First purchase full object:', JSON.stringify(this.purchases[0])); // Debug - full object
      }
      this.total_amount = response.total_amount;
    });
  }

  copyBarcode(barcode: string): void {
    // Copy barcode to clipboard
    navigator.clipboard.writeText(barcode).then(() => {
      alert('Barcode copied: ' + barcode + '\n\nPaste it in the header scanner to test!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = barcode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Barcode copied: ' + barcode + '\n\nPaste it in the header scanner to test!');
    });
  }

  trackByPurchaseId(index: number, purchase: Purchase): any {
    return purchase ? purchase.purchase_id : index;
  }
}
