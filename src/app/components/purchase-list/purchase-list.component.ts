import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AddPurchaseComponent } from '../add-purchase/add-purchase.component';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { ReceivePurchaseComponent } from '../receive-purchase/receive-purchase.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Response } from '../../models/response.model';
import { BehaviorSubject } from 'rxjs';
import { Purchase } from 'src/app/models/purchase.model';
import { PurchaseService } from '../../services/purchase/purchase.service';
import { ItemService } from '../../services/item/item.service';
import { Item } from 'src/app/models/item.model';
import { NotificationService } from '../../services/notification/notification.service';
import { AuthService } from '../../services/auth/auth.service';
import { GridColumn } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.scss']
})
export class PurchaseListComponent implements OnInit, AfterViewInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;
  @ViewChild('barcodeTemplate') barcodeTemplate: TemplateRef<any>;

  items: Item[];
  purchases: Purchase[] = []; // Initialize as empty array
  total_amount: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  columns: GridColumn[] = [];
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private notificationService: NotificationService,
    private purchaseService: PurchaseService,
    private modalService: BsModalService,
    private itemService: ItemService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getPurchases();
    this.refreshItems.subscribe(() => {
      this.getPurchases();
    });
  }

  ngAfterViewInit(): void {
    this.initializeColumns();
    this.cdr.detectChanges();
  }

  initializeColumns(): void {
    this.columns = [
      { 
        key: 'timestamp', 
        label: 'Date', 
        sortable: true, 
        searchable: true,
        valueFormatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
      },
      { 
        key: 'barcode', 
        label: 'Barcode', 
        sortable: true, 
        searchable: true,
        width: '150px',
        cellTemplate: this.barcodeTemplate
      },
      { key: 'invoice_id', label: 'Invoice Id', sortable: true, searchable: true },
      { key: 'vendor.name', label: 'Vendor', sortable: true, searchable: true },
      { key: 'item.name', label: 'Item Name', sortable: true, searchable: true },
      { key: 'item.grade', label: 'Grade', sortable: true, searchable: true },
      { key: 'item.size', label: 'Size', sortable: true, searchable: true },
      { 
        key: 'quantity', 
        label: 'Quantity', 
        sortable: true,
        valueFormatter: (value: any, row: any) => {
          if (!value || !value.value) return '-';
          return `${parseFloat(value.value).toFixed(2)} ${this.quantityUnitToLabelMapping[value.unit] || value.unit}`;
        }
      },
      { 
        key: 'rate', 
        label: 'Rate', 
        sortable: true,
        valueFormatter: (value: number) => value ? parseFloat(String(value)).toFixed(2) : '-'
      },
      { 
        key: 'amount', 
        label: 'Amount', 
        sortable: true,
        valueFormatter: (value: string) => value ? `Rs. ${parseFloat(value).toFixed(2)}` : '-'
      }
    ];
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
            // Show backend validation error to user
            const errorMessage = error.error?.message || error.message || 'Unable to update purchase.';
            this.notificationService.showError(errorMessage);
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
        this.refreshItems.next(undefined);
        
        // Open receive purchase modal to enter spool details
        if (response && response.purchase_id && response.barcode) {
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
            purchase_id: response.purchase_id,
            purchase_barcode: response.barcode,
            item_name: itemName || 'Item',
            total_quantity: purchase.quantity?.value || 0,
            unit: purchase.quantity?.unit || 'KG'
          };
          
          this.modalService.show(ReceivePurchaseComponent, { 
            initialState, 
            backdrop: 'static', 
            keyboard: false,
            class: 'modal-lg'
          });
        }
      },
      error: (error) => {
        // Still refresh to show current state
        this.refreshItems.next(undefined);
      }
    });
  }

  removeItem(purchaseId: string) {
    const initialState = {
      title: 'Confirm Removal',
      message: 'Are you sure you want to remove this purchase? This action cannot be undone if the purchase is not being used.',
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
          this.purchaseService.removeItem(purchaseId).subscribe({
            next: (response: any) => {
              this.notificationService.showSuccess(response.message || 'Purchase removed successfully.');
              this.refreshItems.next(undefined);
            },
            error: (error) => {
              // Display the error message from the API
              // Angular HttpClient wraps error responses, so we need to check multiple places
              let errorMessage = 'Error removing purchase';
              
              if (error.error && error.error.message) {
                errorMessage = error.error.message;
              } else if (error.message) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }
              
              this.notificationService.showError(errorMessage);
            }
          });
        }
      });
    }
  }

  getPurchases(){
    this.purchaseService.getPurchases()
    .subscribe((response: Response<Purchase>) => {
      this.purchases = response.items || [];
      this.total_amount = response.total_amount;
    });
  }

  receivePurchase(purchase: Purchase) {
    // Check if purchase has been received (has inventory entries)
    if (!purchase.barcode) {
      this.notificationService.showError('Purchase barcode is missing. Cannot receive purchase.');
      return;
    }
    
    if (!purchase.purchase_id) {
      this.notificationService.showError('Purchase ID is missing. Cannot receive purchase.');
      return;
    }
    
    // Get item details
    let itemName = '';
    if (purchase.item && purchase.item.name) {
      itemName = `${purchase.item.name} Grade: ${purchase.item.grade || ''} Size: ${purchase.item.size || ''}`;
    }
    
    const initialState = {
      purchase_id: String(purchase.purchase_id), // Ensure it's a string
      purchase_barcode: purchase.barcode,
      item_name: itemName || 'Item',
      total_quantity: purchase.quantity?.value || 0,
      unit: purchase.quantity?.unit || 'KG',
      isReceived: false // Will be checked in component
    };
    
    try {
      const modalRef = this.modalService.show(ReceivePurchaseComponent, { 
        initialState, 
        backdrop: 'static', 
        keyboard: false,
        class: 'modal-lg'
      });
      
      if (!modalRef) {
        this.notificationService.showError('Failed to open receive purchase modal. Please try again.');
      }
    } catch (error) {
      this.notificationService.showError('Error opening receive purchase form: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  copyBarcode(barcode: string): void {
    // Copy barcode to clipboard
    navigator.clipboard.writeText(barcode).then(() => {
      this.notificationService.showSuccess('Barcode copied: ' + barcode + '. Paste it in the header scanner to test!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = barcode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.notificationService.showSuccess('Barcode copied: ' + barcode + '. Paste it in the header scanner to test!');
    });
  }

  printLabels(purchase: Purchase): void {
    if (!purchase.purchase_id) {
      this.notificationService.showError('Purchase ID is missing. Cannot print labels.');
      return;
    }
    
    // Fetch packages for this purchase
    this.purchaseService.getPurchasePackages(String(purchase.purchase_id)).subscribe({
      next: (response: any) => {
        if (response.packages && response.packages.length > 0) {
          // Get item details
          let itemName = response.item_name || '';
          if (!itemName && purchase.item && purchase.item.name) {
            itemName = `${purchase.item.name} Grade: ${purchase.item.grade || ''} Size: ${purchase.item.size || ''}`;
          }
          
          const unit = response.unit || purchase.quantity?.unit || 'KG';
          const firstPackage = response.packages[0];
          
          const initialState = {
            barcode: firstPackage.package_barcode,
            itemName: itemName || 'Item',
            quantity: firstPackage.net_quantity || firstPackage.quantity,
            netQuantity: firstPackage.net_quantity,
            unit: unit,
            labelCount: response.packages.length,
            allPackages: response.packages
          };
          
          this.modalService.show(PrintLabelsComponent, {
            initialState,
            backdrop: 'static',
            keyboard: false,
            class: 'modal-lg'
          });
        } else {
          this.notificationService.showError('No packages found for this purchase. Please receive the purchase first.');
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Unable to fetch packages.';
        if (errorMessage.includes('not been received')) {
          this.notificationService.showError('Purchase has not been received yet. Please receive the purchase first.');
        } else {
          this.notificationService.showError('Error fetching packages: ' + errorMessage);
        }
      }
    });
  }

  trackByPurchaseId(index: number, purchase: Purchase): string {
    return purchase?.purchase_id ? String(purchase.purchase_id) : index.toString();
  }
}
