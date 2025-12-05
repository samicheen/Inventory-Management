import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { InventoryService } from '../inventory/inventory.service';
import { SellItemComponent } from '../../components/sell-item/sell-item.component';
import { AddInventoryItemComponent } from '../../components/add-inventory-item/add-inventory-item.component';
import { AddManufacturingComponent } from '../../components/add-manufacturing/add-manufacturing.component';
import { SalesService } from '../sales/sales.service';
import { ManufactureService } from '../manufacture/manufacture.service';
import { ItemService } from '../item/item.service';
import { ChoiceDialogComponent } from '../../components/choice-dialog/choice-dialog.component';
import { PrintLabelsComponent } from '../../components/print-labels/print-labels.component';
import { NotificationService } from '../notification/notification.service';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  
  constructor(
    private inventoryService: InventoryService,
    private modalService: BsModalService,
    private salesService: SalesService,
    private manufactureService: ManufactureService,
    private itemService: ItemService,
    private notificationService: NotificationService,
    private router: Router,
    private refreshService: RefreshService
  ) { }

  /**
   * Scan barcode and open appropriate form
   * @param barcode Scanned barcode (e.g., PUR-001, SCUT-001, COND-001)
   */
  scanBarcode(barcode: string): void {
    if (!barcode || barcode.trim() === '') {
      this.notificationService.showError('Invalid barcode');
      return;
    }

    // Lookup barcode
    this.inventoryService.getInventoryByBarcode(barcode.trim()).subscribe(
      (response: any) => {
        if (response.action === 'manufacture') {
          // Raw material (PUR-xxx) → Open manufacturing form to send to manufacturing
          this.openSendToManufacturingForm(response);
        } else if (response.action === 'choice') {
          // SCUT that can be sold OR processed further → Show choice
          this.showChoiceDialog(response);
        } else if (response.action === 'sell') {
          // Processed item (COND-xxx or SCUT that can't be processed further) → Open sales form
          this.openSalesForm(response);
        } else {
          console.error('Unknown action:', response.action, response); // Debug
          this.notificationService.showError('Unknown barcode type: ' + (response.action || 'no action'));
        }
      },
      (error) => {
        if (error.status === 404) {
          this.notificationService.showError('Barcode not found: ' + barcode);
        } else {
          this.notificationService.showError('Error looking up barcode: ' + error.message);
        }
      }
    );
  }

  /**
   * Open manufacturing form to send raw material to manufacturing
   * This is Step 1: Move raw material to manufacturing
   */
  private openSendToManufacturingForm(barcodeData: any): void {
    // If it's a package barcode with complete data (net_quantity), directly add to manufacturing
    // Package barcodes have is_package flag and available_quantity is already the net quantity
    if (barcodeData.is_package && barcodeData.available_quantity && barcodeData.available_quantity.value > 0) {
      this.directlyAddToManufacturing(barcodeData);
      return;
    }
    
    const initialState = {
      item: barcodeData.item,
      barcode: barcodeData.barcode,
      available_quantity: barcodeData.available_quantity,
      rate: barcodeData.rate
    };

    const modalRef = this.modalService.show(AddManufacturingComponent, { 
      initialState, 
      backdrop: 'static', 
      keyboard: false 
    });

    // Subscribe to save event
    if (modalRef.content) {
      modalRef.content.addToManufacturing.subscribe((manufacture: any) => {
        // Add source_barcode to manufacture data
        manufacture.source_barcode = barcodeData.barcode;
        manufacture.available_quantity = barcodeData.available_quantity;
        
        this.manufactureService.addToManufacturing(manufacture).subscribe(
          () => {
            // Success - modal will close automatically
            this.notificationService.showSuccess('Raw material sent to manufacturing. After processing, add sub-item from Manufacturing list.');
            // Trigger refresh for manufacturing and inventory pages
            this.refreshService.triggerRefresh('manufacturing');
            this.refreshService.triggerRefresh('inventory');
          },
          (error) => {
            this.notificationService.showError('Error sending to manufacturing: ' + (error.error?.message || error.message));
          }
        );
      });
    }
  }

  /**
   * Directly add package to manufacturing without showing form
   * Used when package barcode has complete data (net_quantity already calculated)
   * Groups packages by parent purchase barcode (source_barcode)
   */
  private directlyAddToManufacturing(barcodeData: any): void {
    // Use parent purchase barcode (source_barcode) for grouping, not the individual package barcode
    // This ensures all packages from the same purchase are grouped together
    const parentBarcode = barcodeData.source_barcode || barcodeData.barcode;
    
    const manufacture: any = {
      item: {
        item_id: barcodeData.item.item_id
      },
      source_barcode: parentBarcode, // Use parent purchase barcode for grouping
      package_barcode: barcodeData.barcode, // Include package barcode to check for duplicates
      booked_quantity: {
        value: barcodeData.available_quantity.value, // This is already net quantity
        unit: barcodeData.available_quantity.unit
      },
      quantity: {
        value: barcodeData.available_quantity.value, // This is already net quantity
        unit: barcodeData.available_quantity.unit
      },
      timestamp: new Date().toISOString()
    };

    this.manufactureService.addToManufacturing(manufacture).subscribe(
      () => {
        this.notificationService.showSuccess(
          `Package ${barcodeData.barcode} sent to manufacturing (grouped under ${parentBarcode}). ` +
          `After processing, add sub-item from Manufacturing list.`
        );
        // Trigger refresh for manufacturing and inventory pages
        this.refreshService.triggerRefresh('manufacturing');
        this.refreshService.triggerRefresh('inventory');
      },
      (error) => {
        const errorMessage = error.error?.message || error.message;
        // Check if it's a duplicate package error
        if (errorMessage.includes('already been added') || errorMessage.includes('duplicate')) {
          this.notificationService.showError(`Package ${barcodeData.barcode} has already been added to manufacturing.`);
        } else {
          this.notificationService.showError('Error sending to manufacturing: ' + errorMessage);
        }
      }
    );
  }

  /**
   * Show choice dialog for SCUT: Sell or Process Further
   */
  private showChoiceDialog(barcodeData: any): void {
    const initialState = {
      title: 'Choose Action',
      message: 'What would you like to do with this SCUT item?',
      itemName: `${barcodeData.item.name} Grade: ${barcodeData.item.grade} Size: ${barcodeData.item.size}`
    };

    const modalRef = this.modalService.show(ChoiceDialogComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-md'
    });

    if (modalRef.content) {
      modalRef.content.choice.subscribe((choice: boolean) => {
        if (choice) {
          // User chose to sell (first choice)
          this.openSalesForm(barcodeData);
        } else {
          // User chose to process further (second choice)
          this.openProcessFurtherForm(barcodeData);
        }
      });
    }
  }

  /**
   * Open form to process SCUT further to Conditioned
   */
  private openProcessFurtherForm(barcodeData: any): void {
    // Create a mock manufacture entry for the SCUT
    const manufactureEntry = {
      item: barcodeData.item,
      source_barcode: barcodeData.barcode,
      booked_quantity: barcodeData.available_quantity,
      quantity: barcodeData.available_quantity,
      timestamp: new Date().toISOString()
    };
    
    const initialState = {
      parentItem: barcodeData.item,
      manufactureEntry: manufactureEntry
    };
    
    const modalRef = this.modalService.show(AddInventoryItemComponent, { 
      initialState, 
      backdrop: 'static', 
      keyboard: false 
    });
    
    // Pre-select Conditioned processing type only (user will select the specific Conditioned item from dropdown)
    if (modalRef.content) {
      setTimeout(() => {
        modalRef.content.processingType.setValue('conditioned');
      }, 100);
      
      modalRef.content.saveAndPrintInventoryItems.subscribe((item: any) => {
        this.inventoryService.addInventoryItem(item).subscribe(
          (response: any) => {
            // Success - modal will close automatically
            // Trigger refresh for manufacturing and inventory pages
            this.refreshService.triggerRefresh('manufacturing');
            this.refreshService.triggerRefresh('inventory');
            if (response && response.barcode) {
              // Open print labels modal
              this.openPrintLabelsModal(response, item);
            }
          },
          (error) => {
            this.notificationService.showError('Error processing SCUT: ' + (error.error?.message || error.message));
          }
        );
      });
    }
  }

  /**
   * Open print labels modal after creating inventory item
   */
  private openPrintLabelsModal(response: any, itemData: any): void {
    // Get the sub-item details (the item that was created)
    this.itemService.getItems(true).subscribe((itemsResponse: any) => {
      const createdItem = itemsResponse.items.find((i: any) => i.item_id === itemData.item.item_id);
      const itemName = createdItem 
        ? `${createdItem.name} Grade: ${createdItem.grade} Size: ${createdItem.size}`
        : 'Item';
      
      // Extract quantity value (handle both Quantity object and number)
      const quantityValue = typeof itemData.closing_stock === 'object' 
        ? (itemData.closing_stock?.value || 0)
        : (itemData.closing_stock || 0);
      const quantityUnit = typeof itemData.closing_stock === 'object'
        ? (itemData.closing_stock?.unit || 'KG')
        : 'KG';
      
      const printInitialState = {
        barcode: response.barcode,
        itemName: itemName,
        quantity: quantityValue,
        unit: quantityUnit,
        labelCount: 1
      };
      
      this.modalService.show(PrintLabelsComponent, { 
        initialState: printInitialState, 
        backdrop: 'static', 
        keyboard: false,
        class: 'modal-lg'
      });
    });
  }

  /**
   * Open sales form with pre-filled data from barcode scan
   */
  private openSalesForm(barcodeData: any): void {
    const item = {
      item_id: barcodeData.item.item_id,
      name: barcodeData.item.name,
      size: barcodeData.item.size,
      grade: barcodeData.item.grade
    };

    const initialState = {
      item: item,
      availableQuantity: barcodeData.available_quantity,
      rate: barcodeData.rate,
      barcode: barcodeData.barcode
    };

    const modalRef = this.modalService.show(SellItemComponent, { 
      initialState, 
      backdrop: 'static', 
      keyboard: false 
    });

    // Subscribe to sell event
    if (modalRef.content) {
      modalRef.content.sell.subscribe((sale: any) => {
        this.salesService.sellItem(sale).subscribe(
          () => {
            // Success - modal will close automatically
            // Trigger refresh for sales and inventory pages
            this.refreshService.triggerRefresh('sales');
            this.refreshService.triggerRefresh('inventory');
          },
          (error) => {
            this.notificationService.showError('Error selling item: ' + (error.error?.message || error.message));
          }
        );
      });
    }
  }
}

