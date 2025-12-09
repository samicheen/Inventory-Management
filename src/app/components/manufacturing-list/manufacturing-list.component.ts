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
          this.printLabelsForPackages(response.packages);
        }
      }, (error) => {
        console.error('Error adding inventory:', error);
      });
    });
  }

  printLabelsForPackages(packages: any[]): void {
    // Print labels for all packages
    // Group by item and net_quantity to batch print packages with same weight
    const groupedPackages = new Map<string, any[]>();
    
    packages.forEach(pkg => {
      // Use net_quantity for grouping if available, otherwise use weight
      const quantity = pkg.net_quantity !== undefined && pkg.net_quantity !== null 
        ? pkg.net_quantity 
        : (pkg.weight !== undefined ? Number(pkg.weight) : (pkg.quantity !== undefined ? Number(pkg.quantity) : 0));
      const key = `${pkg.item_name}_${pkg.item_grade}_${pkg.item_size}_${quantity}_${pkg.unit}`;
      if (!groupedPackages.has(key)) {
        groupedPackages.set(key, []);
      }
      groupedPackages.get(key)!.push(pkg);
    });
    
    // Print labels for each group
    let firstPackage = true;
    groupedPackages.forEach((pkgGroup, key) => {
      const firstPkg = pkgGroup[0];
      
      // Calculate total quantity (sum of all package net_quantities)
      let totalQuantity = 0;
      pkgGroup.forEach(pkg => {
        const qty = pkg.net_quantity !== undefined && pkg.net_quantity !== null 
          ? Number(pkg.net_quantity) 
          : (pkg.weight !== undefined ? Number(pkg.weight) : (pkg.quantity !== undefined ? Number(pkg.quantity) : 0));
        totalQuantity += isNaN(qty) ? 0 : qty;
      });
      
      // Format packages for print labels component
      const formattedPackages = pkgGroup.map(pkg => ({
        package_barcode: pkg.package_barcode || pkg.barcode,
        net_quantity: pkg.net_quantity !== undefined && pkg.net_quantity !== null 
          ? Number(pkg.net_quantity) 
          : (pkg.weight !== undefined ? Number(pkg.weight) : (pkg.quantity !== undefined ? Number(pkg.quantity) : 0)),
        quantity: pkg.weight !== undefined ? Number(pkg.weight) : (pkg.quantity !== undefined ? Number(pkg.quantity) : 0)
      }));
      
      const initialState = {
        barcode: firstPkg.package_barcode || firstPkg.barcode,
        itemName: `${firstPkg.item_name} Grade: ${firstPkg.item_grade} Size: ${firstPkg.item_size}`,
        quantity: totalQuantity, // Total quantity for all packages in this group
        netQuantity: totalQuantity, // Net quantity (sum of all package net_quantities)
        unit: firstPkg.unit || 'KG',
        labelCount: pkgGroup.length, // Number of packages = number of labels
        allPackages: formattedPackages // Pass all packages with correct structure
      };
      
      if (firstPackage) {
        this.modalService.show(PrintLabelsComponent, {
          initialState,
          backdrop: 'static',
          keyboard: false,
          class: 'modal-lg'
        });
        firstPackage = false;
      }
    });
    
    if (packages.length > 1) {
      setTimeout(() => {
        // Show notification about other packages
        console.log(`Created ${packages.length} packages. Print labels for each package.`);
      }, 500);
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
}
