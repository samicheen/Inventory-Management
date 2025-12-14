import { Component, OnInit, OnDestroy } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { ManufactureService } from 'src/app/services/manufacture/manufacture.service';
import { Manufacture } from 'src/app/models/manufacture.model';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { ItemService } from 'src/app/services/item/item.service';
import { RefreshService } from '../../services/refresh/refresh.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../services/notification/notification.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-manufacturing-list',
  templateUrl: './manufacturing-list.component.html',
  styleUrls: ['./manufacturing-list.component.scss']
})
export class ManufacturingListComponent implements OnInit, OnDestroy {
  manufactures : Manufacture[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  private refreshSubscription: Subscription;
  
  constructor(
    private manufactureService: ManufactureService,
    private inventoryService: InventoryService,
    private modalService: BsModalService,
    private itemService: ItemService,
    private refreshService: RefreshService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getManufacturingItems();
    this.refreshItems.subscribe(() => {
      this.getManufacturingItems();
    });
    
    // Subscribe to refresh service for auto-refresh after barcode scans
    this.refreshSubscription = this.refreshService.refresh$.subscribe((page: string) => {
      if (page === 'manufacturing' || page === 'all') {
        this.getManufacturingItems();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getManufacturingItems(){
    this.manufactureService.getManufacturingItems()
    .subscribe((response: Response<Manufacture>) => {
      this.manufactures = response.items;
    });
  }

  addSubItem(manufacture: Manufacture) {
    const initialState = {
      parentItem: manufacture.item,
      manufactureEntry: manufacture // Pass full manufacturing entry with source_barcode, rate, etc.
    };
    let addSubItemModalRef = this.modalService.show(AddInventoryItemComponent, { initialState, backdrop: 'static', keyboard: false });
    addSubItemModalRef.content.saveAndPrintInventoryItems.subscribe(data => {
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
        this.notificationService.showError(error.error?.message || 'Error adding inventory item');
      });
    });
  }

  printLabelsForPackages(packages: any[]): void {
    if (!packages || packages.length === 0) {
      this.notificationService.showError('No packages found to print labels for.');
      return;
    }

    // Show all packages in a single modal (no grouping)
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

    // Use first package for basic info, but show all packages
    const firstPkg = formattedPackages[0];
    
    const initialState = {
      barcode: firstPkg.package_barcode,
      itemName: `${firstPkg.item_name} Grade: ${firstPkg.item_grade} Size: ${firstPkg.item_size}`,
      quantity: totalQuantity, // Total quantity for all packages
      netQuantity: totalQuantity, // Net quantity (sum of all package net_quantities)
      unit: firstPkg.unit || 'KG',
      labelCount: packages.length, // Number of packages = number of labels
      allPackages: formattedPackages // Pass all packages with correct structure
    };
    
    // Open single modal with all packages
    this.modalService.show(PrintLabelsComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-lg'
    });
    
    if (packages.length > 1) {
      console.log(`Created ${packages.length} packages. Print labels for each package.`);
    }
  }

  removeManufacture(manufacture: Manufacture): void {
    const initialState = {
      title: 'Confirm Removal',
      message: `Are you sure you want to remove this manufacturing entry?\n\nItem: ${manufacture.item.name} Grade: ${manufacture.item.grade} Size: ${manufacture.item.size}\nSource Barcode: ${manufacture.source_barcode || 'N/A'}\nQuantity: ${manufacture.quantity.value} ${this.quantityUnitToLabelMapping[manufacture.quantity.unit]}\n\nNote: This can only be done if no sub-items have been created from this manufacturing entry.`,
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
        if (confirmed && manufacture.manufacture_id) {
          this.manufactureService.removeManufacture(String(manufacture.manufacture_id)).subscribe({
            next: (response: any) => {
              this.notificationService.showSuccess(response.message || 'Manufacturing entry removed successfully.');
              this.refreshItems.next(undefined);
            },
            error: (error) => {
              const errorMessage = error.error?.message || error.message || 'Error removing manufacturing entry';
              this.notificationService.showError(errorMessage);
            }
          });
        }
      });
    }
  }

  printLabels(manufacture: Manufacture): void {
    if (!manufacture.manufacture_id && !manufacture.source_barcode) {
      this.notificationService.showError('Manufacturing entry is missing required information. Cannot print labels.');
      return;
    }

    // Get packages for this manufacturing entry
    const manufactureId = manufacture.manufacture_id ? String(manufacture.manufacture_id) : undefined;
    const sourceBarcode = manufacture.source_barcode;
    const itemId = manufacture.item?.item_id ? String(manufacture.item.item_id) : undefined;

    this.manufactureService.getPackagesByManufacture(manufactureId, sourceBarcode, itemId).subscribe({
      next: (response: any) => {
        if (response && response.packages && response.packages.length > 0) {
          this.printLabelsForPackages(response.packages);
        } else {
          this.notificationService.showError('No packages found for this manufacturing entry. Please add sub-items first.');
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Error fetching packages';
        this.notificationService.showError(errorMessage);
      }
    });
  }
}
