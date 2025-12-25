import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { PurchaseService } from '../../services/purchase/purchase.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PrintLabelsComponent } from '../print-labels/print-labels.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { InventoryService } from '../../services/inventory/inventory.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';

export interface PackageDetail {
  package_number: number;
  quantity: number;
  packaging_weight?: number; // Optional: for items like spools that have packaging weight
  net_quantity: number;
  package_barcode: string;
  package_quantity?: number; // Number of packages with same weight (for bulk add)
}

@Component({
  selector: 'app-receive-purchase',
  templateUrl: './receive-purchase.component.html',
  styleUrls: ['./receive-purchase.component.scss']
})
export class ReceivePurchaseComponent implements OnInit {
  // Properties assigned from initialState by ngx-bootstrap
  purchase_id: string;
  purchase_barcode: string;
  item_name: string;
  total_quantity: number;
  unit: string;
  isReceived?: boolean; // Whether purchase has already been received
  
  receiveForm: FormGroup;
  packages: FormArray;
  totalNetQuantity: number = 0;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  hasPackagingWeight: boolean = false; // Whether to show packaging weight field (for spools, etc.)
  existingPackages: any[] = []; // Existing packages if already received
  
  get quantityMatches(): boolean {
    const tolerance = 0.01; // Allow small rounding differences
    const purchaseQty = typeof this.total_quantity === 'number' ? this.total_quantity : parseFloat(String(this.total_quantity)) || 0;
    return Math.abs(this.totalNetQuantity - purchaseQty) <= tolerance;
  }
  
  get quantityDifference(): number {
    const purchaseQty = typeof this.total_quantity === 'number' ? this.total_quantity : parseFloat(String(this.total_quantity)) || 0;
    return Math.abs(this.totalNetQuantity - purchaseQty);
  }
  
  get purchaseQuantity(): number {
    return typeof this.total_quantity === 'number' ? this.total_quantity : parseFloat(String(this.total_quantity)) || 0;
  }

  constructor(
    public modalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private purchaseService: PurchaseService,
    private notificationService: NotificationService,
    private modalService: BsModalService,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    // Ensure required properties are set (from initialState)
    if (!this.purchase_id || !this.purchase_barcode) {
      this.notificationService.showError('Error: Missing purchase information. Please try again.');
      return;
    }
    
    // Initialize default values if not provided and ensure correct types
    if (!this.unit) {
      this.unit = 'KG';
    }
    // Ensure total_quantity is a number
    if (this.total_quantity === undefined || this.total_quantity === null) {
      this.total_quantity = 0;
    } else if (typeof this.total_quantity === 'string') {
      this.total_quantity = parseFloat(this.total_quantity) || 0;
    } else {
      this.total_quantity = Number(this.total_quantity) || 0;
    }
    if (!this.item_name) {
      this.item_name = 'Item';
    }
    
    // Determine if we need packaging weight field based on unit
    // For KG, show packaging weight (spools, etc.)
    // For NOS and LITRES, just show quantity
    // MUST be set BEFORE creating the form
    this.hasPackagingWeight = this.unit === 'KG';
    
    // Check if purchase has been received
    this.checkIfReceived();
    
    this.receiveForm = this.formBuilder.group({
      packages: this.formBuilder.array([this.createPackageFormGroup()])
    });
    this.packages = this.receiveForm.get('packages') as FormArray;
    this.calculateTotal();
  }

  checkIfReceived(): void {
    // Check if inventory exists for this purchase
    if (this.purchase_id) {
      // Check if purchase has been received by checking for inventory entries
      this.purchaseService.getProcessedQuantities(this.purchase_barcode).subscribe({
        next: (response: any) => {
          // If there's any inventory created, purchase has been received
          // We can check by trying to receive again - backend will tell us
          this.isReceived = false; // Will be updated when we try to receive
        },
        error: () => {
          // No inventory found, purchase not received yet
          this.isReceived = false;
        }
      });
    } else {
      this.isReceived = false;
    }
  }

  loadExistingPackages(): void {
    // Load existing package details from backend if available
    // This would require a new API endpoint to get package details
    // For now, just show a message that it's already received
    this.notificationService.showInfo('This purchase has already been received. You can view existing packages below.');
  }

  createPackageFormGroup(): FormGroup {
    // Ensure hasPackagingWeight is set (should be set in ngOnInit before calling this)
    const needsPackagingWeight = this.hasPackagingWeight || this.unit === 'KG';
    
    const group: any = {
      quantity: ['', [Validators.required, Validators.min(0)]],
      package_quantity: [1, [Validators.required, Validators.min(1)]] // Number of packages with same weight
    };
    
    // Add packaging weight field only if needed (for KG unit)
    if (needsPackagingWeight) {
      group.packaging_weight = ['', [Validators.required, Validators.min(0)]];
    }
    
    return this.formBuilder.group(group);
  }

  addPackage(): void {
    this.packages.push(this.createPackageFormGroup());
  }

  removePackage(index: number): void {
    if (this.packages.length > 1) {
      this.packages.removeAt(index);
      this.calculateTotal();
    }
  }

  calculateTotal(): void {
    this.totalNetQuantity = 0;
    this.packages.controls.forEach(control => {
      const quantityValue = control.get('quantity')?.value;
      const quantity = quantityValue !== null && quantityValue !== undefined && quantityValue !== '' 
        ? parseFloat(String(quantityValue)) 
        : 0;
      
      if (isNaN(quantity)) {
        return; // Skip invalid entries
      }
      
      const packageQuantityValue = control.get('package_quantity')?.value;
      const packageQuantity = packageQuantityValue !== null && packageQuantityValue !== undefined && packageQuantityValue !== ''
        ? parseInt(String(packageQuantityValue))
        : 1;
      
      let net = quantity;
      
      if (this.hasPackagingWeight) {
        const packagingWeightValue = control.get('packaging_weight')?.value;
        const packagingWeight = packagingWeightValue !== null && packagingWeightValue !== undefined && packagingWeightValue !== ''
          ? parseFloat(String(packagingWeightValue))
          : 0;
        
        if (!isNaN(packagingWeight)) {
          net = Math.max(0, quantity - packagingWeight);
        }
      }
      
      // Multiply by package quantity for bulk add
      this.totalNetQuantity += net * packageQuantity;
    });
  }

  getNetQuantity(index: number): number {
    const control = this.packages.at(index);
    if (!control) return 0;
    
    const quantityValue = control.get('quantity')?.value;
    const quantity = quantityValue !== null && quantityValue !== undefined && quantityValue !== '' 
      ? parseFloat(String(quantityValue)) 
      : 0;
    
    if (isNaN(quantity)) return 0;
    
    if (this.hasPackagingWeight) {
      const packagingWeightValue = control.get('packaging_weight')?.value;
      const packagingWeight = packagingWeightValue !== null && packagingWeightValue !== undefined && packagingWeightValue !== ''
        ? parseFloat(String(packagingWeightValue))
        : 0;
      
      if (isNaN(packagingWeight)) {
        return quantity;
      }
      
      const net = Math.max(0, quantity - packagingWeight);
      return net;
    }
    
    return quantity;
  }

  receivePurchase(): void {
    if (this.receiveForm.valid) {
      // Validate that total net quantity matches purchase quantity
      const tolerance = 0.01; // Allow small rounding differences (0.01 unit)
      const purchaseQty = this.purchaseQuantity;
      const difference = Math.abs(this.totalNetQuantity - purchaseQty);
      
      if (difference > tolerance) {
        this.notificationService.showError(
          `Total net quantity (${this.totalNetQuantity.toFixed(2)} ${this.quantityUnitToLabelMapping[this.unit as QuantityUnit] || this.unit}) ` +
          `does not match purchase quantity (${purchaseQty.toFixed(2)} ${this.quantityUnitToLabelMapping[this.unit as QuantityUnit] || this.unit}). ` +
          `Difference: ${difference.toFixed(2)} ${this.quantityUnitToLabelMapping[this.unit as QuantityUnit] || this.unit}`
        );
        return;
      }
      
      const packagesData = this.packages.value.map((pkg: any, index: number) => {
        const packageGroup = this.packages.at(index);
        const quantityValue = packageGroup.get('quantity')?.value;
        const quantity = quantityValue !== null && quantityValue !== undefined && quantityValue !== ''
          ? parseFloat(String(quantityValue))
          : 0;
        
        const packageQuantityValue = packageGroup.get('package_quantity')?.value;
        const packageQuantity = packageQuantityValue !== null && packageQuantityValue !== undefined && packageQuantityValue !== ''
          ? parseInt(String(packageQuantityValue))
          : 1;
        
        let netQuantity = quantity;
        let packagingWeight = 0;
        
        if (this.hasPackagingWeight) {
          const packagingWeightValue = packageGroup.get('packaging_weight')?.value;
          packagingWeight = packagingWeightValue !== null && packagingWeightValue !== undefined && packagingWeightValue !== ''
            ? parseFloat(String(packagingWeightValue))
            : 0;
          
          if (!isNaN(packagingWeight)) {
            netQuantity = Math.max(0, quantity - packagingWeight);
          }
        }
        
        return {
          quantity: quantity,
          packaging_weight: this.hasPackagingWeight ? packagingWeight : undefined,
          net_quantity: netQuantity,
          package_quantity: packageQuantity // Number of packages with same weight
        };
      });

      this.purchaseService.receivePurchase(this.purchase_id, packagesData, this.unit).subscribe({
        next: (response: any) => {
          // Check if purchase was already received
          if (response.message && response.message.includes('already been received')) {
            this.isReceived = true;
            this.notificationService.showInfo(response.message);
            // Show existing packages if available
            if (response.packages && response.packages.length > 0) {
              this.existingPackages = response.packages;
              this.notificationService.showInfo('Purchase has already been received. You can view existing packages.');
            }
            // Don't close modal - let user see existing packages
          } else {
            this.notificationService.showSuccess('Purchase received successfully! Package details saved.');
            
            // Open print labels modal for all package barcodes BEFORE closing receive modal
            // This ensures the modal opens properly and canvas elements are ready
            if (response.packages && response.packages.length > 0) {
              // Small delay to ensure response is processed
              setTimeout(() => {
                this.openPrintLabelsModal(response.packages);
                // Close receive modal after print labels modal is opened
                setTimeout(() => {
                  this.modalRef.hide();
                }, 300);
              }, 100);
            } else {
              // No packages, just close the modal
              this.modalRef.hide();
            }
          }
        },
        error: (error) => {
          this.notificationService.showError('Error receiving purchase: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.receiveForm.markAllAsTouched();
      this.notificationService.showError('Please fill in all package details correctly.');
    }
  }

  openPrintLabelsModal(packages: PackageDetail[]): void {
    if (packages.length > 0) {
      // Expand packages based on package_quantity (for bulk add)
      // Each package entry might represent multiple physical packages
      const expandedPackages: PackageDetail[] = [];
      packages.forEach(pkg => {
        const packageCount = pkg.package_quantity || 1;
        // If package_quantity > 1, we need to create multiple entries
        // But the backend already creates individual barcodes for each package
        // So we just use the packages as-is
        expandedPackages.push(pkg);
      });
      
      // Total labels = number of packages returned (backend already created individual barcodes)
      const totalLabels = packages.length;
      
      const firstPackage = packages[0];
      const quantity = (firstPackage.net_quantity !== undefined && firstPackage.net_quantity !== null) 
        ? Number(firstPackage.net_quantity) 
        : ((firstPackage.quantity !== undefined && firstPackage.quantity !== null) ? Number(firstPackage.quantity) : 0);
      const netQuantity = (firstPackage.net_quantity !== undefined && firstPackage.net_quantity !== null) 
        ? Number(firstPackage.net_quantity) 
        : undefined;
      
      const initialState = {
        barcode: firstPackage.package_barcode || '',
        itemName: this.item_name || 'Item',
        quantity: quantity,
        netQuantity: netQuantity, // Include net quantity for QR code
        unit: this.unit || 'KG',
        labelCount: totalLabels || 1, // Auto-set from total packages created
        allPackages: packages // Pass all packages for batch printing
      };
      
      this.modalService.show(PrintLabelsComponent, {
        initialState,
        backdrop: 'static',
        keyboard: false,
        class: 'modal-lg'
      });
      
      // Show notification about packages
      if (packages.length > 1) {
        setTimeout(() => {
          this.notificationService.showInfo(`Generated ${packages.length} package QR codes with weight information. Ready to print.`);
        }, 500);
      }
    }
  }

  cancel(): void {
    this.modalRef.hide();
  }
}
