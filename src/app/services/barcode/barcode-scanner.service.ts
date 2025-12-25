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
import { PrintLabelsComponent } from '../../components/print-labels/print-labels.component';
import { ChoiceDialogComponent } from '../../components/choice-dialog/choice-dialog.component';
import { ProcessFurtherPackagesComponent } from '../../components/process-further-packages/process-further-packages.component';
import { ScanSalesPackagesComponent } from '../../components/scan-sales-packages/scan-sales-packages.component';
import { PartyService } from '../party/party.service';
import { NotificationService } from '../notification/notification.service';
import { RefreshService } from '../refresh/refresh.service';
import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

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
    private partyService: PartyService,
    private notificationService: NotificationService,
    private router: Router,
    private refreshService: RefreshService
  ) { }

  /**
   * Extract barcode from Capacitor scanner result
   * Our QR codes are JSON strings with structure: {barcode, itemName, quantity, unit}
   * @param result Result from CapacitorBarcodeScanner.scanBarcode()
   * @returns Extracted barcode string or null if not found
   */
  extractBarcodeFromScanResult(result: any): string | null {
    if (!result?.ScanResult) {
      return null;
    }

    // Our QR codes are JSON: {barcode, itemName, quantity, unit}
    try {
      const parsed = JSON.parse(String(result.ScanResult).trim());
      return parsed.barcode?.trim() || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Open native barcode scanner and return the scanned barcode
   * @returns Promise<string | null> The scanned barcode or null if cancelled/error
   */
  async scanBarcodeWithCamera(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Point your camera at a barcode',
        scanButton: false // Auto-start scanning without button
      });
      
      return this.extractBarcodeFromScanResult(result);
    } catch (error: any) {
      // Don't show error for user cancellation
      if (error.message && !error.message.includes('cancel') && !error.message.includes('Cancel')) {
        this.notificationService.showError('Error scanning barcode: ' + (error.message || 'Unknown error'));
      }
      return null;
    }
  }

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
          // Sub-item that can be sold OR processed further → Show choice dialog
          this.showChoiceDialog(response);
        } else if (response.action === 'sell') {
          // Processed item (final product) → Open sales form
          this.openSalesForm(response);
        } else {
          this.notificationService.showError('Unknown barcode type: ' + (response.action || 'no action'));
        }
      },
      (error) => {
        if (error.status === 404) {
          this.notificationService.showError('Barcode not found: ' + barcode);
        } else {
          // Show actual API error message if available, otherwise show generic error
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.notificationService.showError(errorMessage);
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
   * Show choice dialog for sub-items: Sell or Process Further
   */
  private showChoiceDialog(barcodeData: any): void {
    const initialState = {
      title: 'Choose Action',
      message: 'What would you like to do with this item?',
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
          this.openProcessFurtherModal(barcodeData);
        }
      });
    }
  }

  /**
   * Open process further modal to scan multiple packages
   */
  private openProcessFurtherModal(barcodeData: any): void {
    const initialState = {
      initialPackage: barcodeData // Pre-add the first scanned package
    };

    const modalRef = this.modalService.show(ProcessFurtherPackagesComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-lg'
    });

    if (modalRef.content) {
      modalRef.content.processFurther.subscribe((data: any) => {
        // Call backend API to unpackage and add to manufacturing
        this.inventoryService.unpackageAndProcessFurther(data).subscribe(
          (response: any) => {
            this.notificationService.showSuccess(
              `Successfully unpackaged ${data.packages.length} package(s) and added to manufacturing. ` +
              `You can now add sub-item from Manufacturing list.`
            );
            // Trigger refresh
            this.refreshService.triggerRefresh('manufacturing');
            this.refreshService.triggerRefresh('inventory');
          },
          (error) => {
            this.notificationService.showError('Error processing packages: ' + (error.error?.message || error.message));
          }
        );
      });
    }
  }

  /**
   * Open sales form with pre-filled data from barcode scan
   * Now uses ScanSalesPackagesComponent to allow multiple package scanning
   */
  private openSalesForm(barcodeData: any): void {
    const initialState = {
      initialPackage: barcodeData // Pre-add the first scanned package
    };

    const modalRef = this.modalService.show(ScanSalesPackagesComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-lg'
    });

    if (modalRef.content) {
      modalRef.content.sell.subscribe((salesData: any[]) => {
        // Get customer details first
        const customerId = salesData[0].customer_id;
        const invoiceId = salesData[0].invoice_id; // Common invoice ID for all packages
        this.partyService.getParties('customer').subscribe(
          (partiesResponse: any) => {
            // Service always transforms parties to items - use items only
            const parties = partiesResponse.items || [];
            // Convert both to strings for comparison (form values are strings, party_id might be number)
            const customer = parties.find((p: any) => String(p.party_id) === String(customerId));
            if (!customer) {
              this.notificationService.showError('Customer not found. Customer ID: ' + customerId);
              return;
            }

            // Prepare all sales in a single array
            const allSales: any[] = [];
            const timestamp = salesData[0].timestamp || new Date(); // Use timestamp from form or default to now
            salesData.forEach((salesGroup) => {
              salesGroup.packages.forEach((pkg: any) => {
                allSales.push({
                  item: salesGroup.item,
                  quantity: {
                    value: pkg.quantity,
                    unit: pkg.unit
                  },
                  selling_price: salesGroup.selling_price.toString(),
                  amount: (pkg.quantity * salesGroup.selling_price).toFixed(2),
                  barcode: pkg.barcode,
                  timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp
                });
              });
            });

            // Send all sales in a single API call
            this.salesService.sellItems(invoiceId, { name: customer.name }, allSales).subscribe(
              (response: any) => {
                if (response.success) {
                  this.notificationService.showSuccess(response.message);
                  this.refreshService.triggerRefresh('sales');
                  this.refreshService.triggerRefresh('inventory');
                } else {
                  // Some errors occurred
                  const errorMessages = response.results
                    .filter((r: any) => !r.success)
                    .map((r: any) => `Package ${r.barcode || 'N/A'}: ${r.error || 'Unknown error'}`)
                    .join('; ');
                  this.notificationService.showError(response.message + (errorMessages ? ' Details: ' + errorMessages : ''));
                  this.refreshService.triggerRefresh('sales');
                  this.refreshService.triggerRefresh('inventory');
                }
              },
              (error) => {
                this.notificationService.showError('Error selling packages: ' + (error.error?.message || error.message));
                this.refreshService.triggerRefresh('sales');
                this.refreshService.triggerRefresh('inventory');
              }
            );
          },
          (error) => {
            this.notificationService.showError('Error loading customer: ' + (error.error?.message || error.message));
          }
        );
      });
    }
  }
}

