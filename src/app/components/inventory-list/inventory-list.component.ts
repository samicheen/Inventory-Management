import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { InventoryItem } from 'src/app/models/inventory-item.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Item } from 'src/app/models/item.model';
import { SellItemComponent } from '../sell-item/sell-item.component';
import { SalesService } from 'src/app/services/sales/sales.service';
import { AddManufacturingComponent } from '../add-manufacturing/add-manufacturing.component';
import { ManufactureService } from 'src/app/services/manufacture/manufacture.service';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';
import { NotificationService } from '../../services/notification/notification.service';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { RefreshService } from '../../services/refresh/refresh.service';
import { AuthService } from '../../services/auth/auth.service';
import { GridColumn } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tabset') tabset: TabsetComponent;
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;
  @ViewChild('barcodeTemplate') barcodeTemplate: TemplateRef<any>;
  @ViewChild('itemNameTemplate') itemNameTemplate: TemplateRef<any>;

  inventory: InventoryItem[];
  inventoryParameters: Map<string, any> = new Map();
  total: any;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  columns: GridColumn[] = [];
  private readonly refreshItems = new BehaviorSubject(undefined);
  currentTab: string = 'Main Items'; // Track current tab
  private refreshSubscription: Subscription;
  
  constructor(
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
    private salesService: SalesService,
    private manufactureService: ManufactureService,
    private modalService: BsModalService,
    public route: ActivatedRoute,
    private router: Router,
    private refreshService: RefreshService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.inventoryParameters.set('parent_item_id', this.route.snapshot.params.item_id);
    // Initialize current tab based on route query parameter or default to Main Items
    if (!this.route.snapshot.params.item_id) {
      const tabParam = this.route.snapshot.queryParams['tab'];
      this.currentTab = (tabParam === 'sub-items') ? 'Sub Items' : 'Main Items';
      this.inventoryParameters.set('retrieve_sub_items', this.currentTab === 'Sub Items' ? 1 : 0);
    }
    this.getInventory();
    this.refreshItems.subscribe(() => {
      this.getInventory();
    });
    
    // Subscribe to refresh service for auto-refresh after barcode scans
    this.refreshSubscription = this.refreshService.refresh$.subscribe((page: string) => {
      if (page === 'inventory' || page === 'all') {
        this.getInventory();
      }
    });
  }

  ngAfterViewInit(): void {
    // Set the active tab after view initialization
    // Use setTimeout to defer the change until after the current change detection cycle
    // This prevents ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      if (this.tabset && !this.route.snapshot.params.item_id) {
        const tabParam = this.route.snapshot.queryParams['tab'];
        if (tabParam === 'sub-items') {
          this.tabset.tabs[1].active = true;
          this.tabset.tabs[0].active = false;
        } else {
          this.tabset.tabs[0].active = true;
          this.tabset.tabs[1].active = false;
        }
      }
      this.initializeColumns();
    }, 0);
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
        width: '220px',
        cellTemplate: this.barcodeTemplate
      },
      { 
        key: 'item.name', 
        label: 'Item Name', 
        sortable: true, 
        searchable: true,
        cellTemplate: this.itemNameTemplate
      },
      { key: 'item.grade', label: 'Grade', sortable: true, searchable: true },
      { key: 'item.size', label: 'Size', sortable: true, searchable: true },
      { 
        key: 'initial_stock', 
        label: 'Initial Stock', 
        sortable: true,
        valueFormatter: (value: any) => {
          if (!value || !value.value) return '-';
          return `${parseFloat(value.value).toFixed(2)} ${this.quantityUnitToLabelMapping[value.unit] || value.unit}`;
        }
      },
      { 
        key: 'opening_stock', 
        label: 'Opening Stock', 
        sortable: true,
        valueFormatter: (value: any) => {
          if (!value || !value.value) return '-';
          return `${parseFloat(value.value).toFixed(2)} ${this.quantityUnitToLabelMapping[value.unit] || value.unit}`;
        }
      },
      { 
        key: 'opening_amount', 
        label: 'Opening Amount', 
        sortable: true,
        valueFormatter: (value: string) => value ? `Rs. ${parseFloat(value).toFixed(2)}` : '-'
      },
      { 
        key: 'closing_stock', 
        label: 'Closing Stock', 
        sortable: true,
        valueFormatter: (value: any) => {
          if (!value || !value.value) return '-';
          return `${parseFloat(value.value).toFixed(2)} ${this.quantityUnitToLabelMapping[value.unit] || value.unit}`;
        }
      },
      { 
        key: 'closing_amount', 
        label: 'Closing Amount', 
        sortable: true,
        valueFormatter: (value: string) => value ? `Rs. ${parseFloat(value).toFixed(2)}` : '-'
      }
    ];
  }

  trackByInventoryId(index: number, item: InventoryItem): string {
    return item.inventory_id ? String(item.inventory_id) : index.toString();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getInventory(){
    // Ensure retrieve_sub_items parameter is set correctly based on current tab
    // This ensures the correct tab data is loaded during refresh
    if (!this.route.snapshot.params.item_id) {
      this.inventoryParameters.set('retrieve_sub_items', this.currentTab === 'Sub Items' ? 1 : 0);
    }
    
    this.inventoryService.getInventory(this.inventoryParameters)
    .subscribe((response: Response<InventoryItem>) => {
      this.inventory = response.items;
      this.total = response.total;
    });
  }

  addItem() {
    let addInventoryItemModalRef = this.modalService.show(AddInventoryItemComponent, { backdrop: 'static', keyboard: false });
    addInventoryItemModalRef.content.saveAndPrintInventoryItems.subscribe(data => {
      this.inventoryService.addInventoryItem(data).subscribe((response: any) => {
        this.refreshItems.next(undefined);
        
        // Handle multiple packages and print labels
        if (response && response.packages && response.packages.length > 0) {
          console.log('Received packages from backend:', response.packages);
          this.printLabelsForPackages(response.packages);
        } else {
          console.warn('No packages in response:', response);
        }
      }, (error) => {
        // Handle actual errors
        console.error('Error adding inventory:', error);
        this.notificationService.showError('Error adding inventory: ' + (error.error?.message || error.message || 'Unknown error'));
      });
    });
  }

  removeInventory(inventoryItem: InventoryItem): void {
    const isSubItem = inventoryItem.item?.is_sub_item;
    const inventoryId = inventoryItem.inventory_id;
    const itemId = inventoryItem.item?.item_id;
    
    // For sub-items: use package barcode (from barcode field) or item_id, NEVER source_barcode (purchase barcode)
    // For regular items: use barcode or source_barcode
    let barcode = inventoryItem.barcode; // For sub-items, this contains package barcodes (PROC-001, etc.)
    if (barcode) {
      // Handle comma-separated barcodes from GROUP_CONCAT
      if (barcode.includes(',')) {
        barcode = barcode.split(',')[0].trim();
      }
      barcode = barcode.trim();
    }
    
    // Only use source_barcode for regular items (NOT sub-items)
    if (!barcode && !isSubItem) {
      barcode = inventoryItem.source_barcode;
      if (barcode) {
        barcode = barcode.trim();
      }
    }
    
    if (!inventoryId && !barcode && !itemId) {
      this.notificationService.showError('Inventory ID, barcode, or item ID is missing. Cannot remove inventory.');
      return;
    }
    
    const initialState = {
      title: 'Confirm Removal',
      message: `Are you sure you want to remove this inventory item?\n\nItem: ${inventoryItem.item.name} Grade: ${inventoryItem.item.grade} Size: ${inventoryItem.item.size}\nBarcode: ${barcode || inventoryId || 'N/A'}\n\nNote: This can only be done if the inventory is not being used in manufacturing, sales, or as a source for other items.`,
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
          // For sub-items, prioritize item_id for lookup (more reliable than barcode)
          // Backend will use item_id to find the correct inventory entry
          this.inventoryService.removeInventory(
            inventoryId ? String(inventoryId) : '', 
            barcode || undefined,
            itemId ? String(itemId) : undefined
          ).subscribe({
            next: (response: any) => {
              this.notificationService.showSuccess(response.message || 'Inventory removed successfully.');
              this.refreshItems.next(undefined);
            },
            error: (error) => {
              const errorMessage = error.error?.message || error.message || 'Error removing inventory';
              this.notificationService.showError(errorMessage);
            }
          });
        }
      });
    }
  }

  printLabels(invItem: InventoryItem): void {
    const itemId = typeof invItem.item.item_id === 'string' ? parseInt(invItem.item.item_id, 10) : invItem.item.item_id;
    
    // Check if this is a sub-item (processed item)
    const isSubItem = invItem.item && invItem.item.is_sub_item === true;
    
    if (isSubItem) {
      // For processed items (sub-items), fetch packages from API (same as manufacturing list)
      this.inventoryService.getInventoryPackages(itemId).subscribe(
        (response: any) => {
          if (response && response.packages && response.packages.length > 0) {
            this.printLabelsForPackages(response.packages);
          } else {
            this.notificationService.showError('No packages found for this item.');
          }
        },
        (error) => {
          this.notificationService.showError('Error fetching packages: ' + (error.error?.message || error.message));
        }
      );
    } else {
      // For all other items (initial stock, purchases), fetch individual inventory entries
      this.inventoryService.getInventoryEntriesByItem(itemId).subscribe(
        (response: any) => {
          if (response && response.packages && response.packages.length > 0) {
            this.printLabelsForPackages(response.packages);
          } else {
            this.notificationService.showError('No packages found for this item.');
          }
        },
        (error) => {
          this.notificationService.showError('Error fetching inventory entries: ' + (error.error?.message || error.message));
        }
      );
    }
  }

  printLabelsForPackages(packages: any[]): void {
    if (!packages || packages.length === 0) {
      this.notificationService.showError('No packages found to print labels for.');
      return;
    }
    
    console.log('printLabelsForPackages called with packages:', packages);
    
    // When adding new packages (from "Done and Print Labels"), show ALL packages in a single modal
    // regardless of item or quantity differences - each package gets its own label
    // Format all packages for print labels component
    const formattedPackages = packages.map(pkg => ({
      package_barcode: pkg.package_barcode || pkg.barcode,
      item_name: pkg.item_name,
      item_grade: pkg.item_grade,
      item_size: pkg.item_size,
      net_quantity: pkg.net_quantity !== undefined && pkg.net_quantity !== null 
        ? Number(pkg.net_quantity) 
        : (pkg.weight !== undefined ? Number(pkg.weight) : (pkg.quantity !== undefined ? Number(pkg.quantity) : 0)),
      quantity: pkg.weight !== undefined ? Number(pkg.weight) : (pkg.quantity !== undefined ? Number(pkg.quantity) : 0),
      unit: pkg.unit || 'KG'
    }));

    // Calculate total quantity across all packages
    let totalQuantity = 0;
    formattedPackages.forEach(pkg => {
      totalQuantity += isNaN(pkg.net_quantity) ? 0 : pkg.net_quantity;
    });

    // Use first package for basic info display
    const firstPkg = formattedPackages[0];

    console.log('Opening print labels modal with all packages:', {
      packageCount: packages.length,
      labelCount: packages.length,
      formattedPackages: formattedPackages
    });
    
    const initialState = {
      barcode: firstPkg.package_barcode,
      itemName: `${firstPkg.item_name} Grade: ${firstPkg.item_grade} Size: ${firstPkg.item_size}`,
      quantity: totalQuantity, // Total quantity for all packages
      netQuantity: totalQuantity, // Net quantity (sum of all package net_quantities)
      unit: firstPkg.unit || 'KG',
      labelCount: packages.length, // Number of packages = number of labels
      allPackages: formattedPackages // Pass all packages with correct structure
    };
    
    this.modalService.show(PrintLabelsComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-lg'
    });
  }

  moveToManufacturing(invItem: InventoryItem) {
    // Get purchase barcode (source_barcode) - this links to the original purchase
    // source_barcode might be comma-separated from GROUP_CONCAT, so take the first one
    let purchaseBarcode = invItem.source_barcode;
    if (purchaseBarcode && purchaseBarcode.includes(',')) {
      purchaseBarcode = purchaseBarcode.split(',')[0].trim();
    }
    // Fallback to barcode if source_barcode is not available (for initial stock)
    if (!purchaseBarcode) {
      purchaseBarcode = invItem.barcode;
      if (purchaseBarcode && purchaseBarcode.includes(',')) {
        purchaseBarcode = purchaseBarcode.split(',')[0].trim();
      }
    }
    
    // Pass the inventory item to manufacturing form (to send raw material to manufacturing)
    const initialState = {
      item: invItem.item,
      barcode: purchaseBarcode, // Pass purchase barcode for tracking
      available_quantity: invItem.closing_stock, // Available quantity from inventory
      rate: typeof invItem.rate === 'string' ? parseFloat(invItem.rate) : (invItem.rate || 0) // Convert rate to number
    };
    let addManufacturingModalRef = this.modalService.show(AddManufacturingComponent, { initialState, backdrop: 'static', keyboard: false });
    addManufacturingModalRef.content.addToManufacturing.subscribe((manufacture: any) => {
      // Add source_barcode (purchase barcode) to manufacture data - this links it to the purchase
      manufacture.source_barcode = purchaseBarcode;
      this.manufactureService.addToManufacturing(manufacture).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  sellItem(invItem: InventoryItem) {
    const initialState = {
      item: invItem.item,
      barcode: invItem.barcode || invItem.source_barcode, // Pass barcode for tracking
      availableQuantity: invItem.closing_stock, // Pass available quantity
      rate: typeof invItem.rate === 'string' ? parseFloat(invItem.rate) : (invItem.rate || 0) // Pass rate
    };
    let sellItemModalRef = this.modalService.show(SellItemComponent, { initialState, backdrop: 'static', keyboard: false });
    sellItemModalRef.content.sell.subscribe(sale => {
      this.salesService.sellItem(sale).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  onSelect(data) {
    this.currentTab = data.heading;
    // Update route query parameter to persist tab selection
    const tabParam = data.heading === 'Sub Items' ? 'sub-items' : 'main-items';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabParam },
      queryParamsHandling: 'merge'
    });
    this.inventoryParameters.set('retrieve_sub_items', data.heading === 'Sub Items' ? 1 : 0);
    this.getInventory();
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
}

