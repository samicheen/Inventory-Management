import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Response } from 'src/app/models/response.model';
import { BehaviorSubject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { ManufactureService } from 'src/app/services/manufacture/manufacture.service';
import { Manufacture } from 'src/app/models/manufacture.model';
import { AddInventoryItemComponent } from '../add-inventory-item/add-inventory-item.component';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { ItemService } from 'src/app/services/item/item.service';

@Component({
  selector: 'app-manufacturing-list',
  templateUrl: './manufacturing-list.component.html',
  styleUrls: ['./manufacturing-list.component.scss']
})
export class ManufacturingListComponent implements OnInit {
  manufactures : Manufacture[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private manufactureService: ManufactureService,
    private inventoryService: InventoryService,
    private modalService: BsModalService,
    private itemService: ItemService
  ) { }

  ngOnInit(): void {
    this.getManufacturingItems();
    this.refreshItems.subscribe(() => {
      this.getManufacturingItems();
    });
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
    // Group by item and weight to batch print
    const groupedPackages = new Map<string, any[]>();
    
    packages.forEach(pkg => {
      const key = `${pkg.item_name}_${pkg.item_grade}_${pkg.item_size}_${pkg.weight}_${pkg.unit}`;
      if (!groupedPackages.has(key)) {
        groupedPackages.set(key, []);
      }
      groupedPackages.get(key)!.push(pkg);
    });
    
    // Print labels for each group
    let firstPackage = true;
    groupedPackages.forEach((pkgGroup, key) => {
      const firstPkg = pkgGroup[0];
      const initialState = {
        barcode: firstPkg.barcode,
        itemName: `${firstPkg.item_name} Grade: ${firstPkg.item_grade} Size: ${firstPkg.item_size}`,
        quantity: firstPkg.weight,
        netQuantity: firstPkg.net_quantity || firstPkg.weight, // Include net quantity for QR code
        unit: firstPkg.unit,
        labelCount: pkgGroup.length,
        allPackages: pkgGroup // Pass all packages for QR code generation
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
}
