import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { InventoryService } from '../../services/inventory/inventory.service';
import { NotificationService } from '../../services/notification/notification.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { BarcodeScannerService } from '../../services/barcode/barcode-scanner.service';

interface ScannedPackage {
  barcode: string;
  item: any;
  net_quantity: number;
  unit: string;
  rate: number;
  packaging_weight?: number;
}

@Component({
  selector: 'app-process-further-packages',
  templateUrl: './process-further-packages.component.html',
  styleUrls: ['./process-further-packages.component.scss']
})
export class ProcessFurtherPackagesComponent implements OnInit, OnDestroy {
  // Properties assigned from initialState by ngx-bootstrap
  initialPackage?: any; // Pre-scanned package from choice dialog
  
  @ViewChild('barcodeInputRef', { static: false }) barcodeInputRef?: ElementRef;
  
  scannedPackages: ScannedPackage[] = [];
  processFurtherForm: FormGroup;
  barcodeInput: string = '';
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  processFurther: Subject<any>;
  isMobile = false;
  
  // Barcode scanner detection
  private barcodeBuffer: string = '';
  private barcodeTimer: any = null;
  private readonly BARCODE_TIMEOUT = 100; // ms - barcode scanners type very fast

  constructor(
    private formBuilder: FormBuilder,
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
    private barcodeScannerService: BarcodeScannerService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.processFurther = new Subject();
    
    // Check if running on native platform (mobile app)
    this.isMobile = Capacitor.isNativePlatform();
    
    // No form validation needed - just need packages
    this.processFurtherForm = this.formBuilder.group({});

    // Add initial package if provided
    if (this.initialPackage) {
      this.addPackageToList(this.initialPackage);
    }
    
    // Auto-focus barcode input after modal is fully rendered (only on web)
    if (!this.isMobile) {
      setTimeout(() => {
        if (this.barcodeInputRef) {
          this.barcodeInputRef.nativeElement.focus();
        }
      }, 300);
    }
  }
  
  ngOnDestroy(): void {
    // Clear any pending timers
    if (this.barcodeTimer) {
      clearTimeout(this.barcodeTimer);
    }
  }
  
  /**
   * Global keyboard listener to detect barcode scanner input
   * Barcode scanners type very fast, so we detect rapid input
   * Only captures if input is not focused (user scanning from external scanner)
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Only capture if barcode input is NOT focused (external barcode scanner)
    const isBarcodeInputFocused = document.activeElement === this.barcodeInputRef?.nativeElement;
    
    // If barcode input is focused, let normal typing work
    if (isBarcodeInputFocused) {
      return;
    }
    
    // Ignore if user is typing in other input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }
    
    // Handle Enter key - process accumulated buffer
    if (event.key === 'Enter') {
      if (this.barcodeBuffer.length > 3) {
        this.barcodeInput = this.barcodeBuffer.trim();
        this.scanBarcode();
        this.barcodeBuffer = '';
      }
      if (this.barcodeTimer) {
        clearTimeout(this.barcodeTimer);
        this.barcodeTimer = null;
      }
      return;
    }
    
    // Ignore special keys
    if (event.key === 'Tab' || event.key === 'Shift' || 
        event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' ||
        event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
        event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      return;
    }
    
    // Add character to buffer (barcode scanner input)
    this.barcodeBuffer += event.key;
    
    // Clear previous timer
    if (this.barcodeTimer) {
      clearTimeout(this.barcodeTimer);
    }
    
    // Set timer to process barcode after timeout (barcode scanner finishes)
    this.barcodeTimer = setTimeout(() => {
      if (this.barcodeBuffer.length > 3) { // Minimum barcode length
        // This looks like a barcode scan
        this.barcodeInput = this.barcodeBuffer.trim();
        this.scanBarcode();
        this.barcodeBuffer = '';
      } else {
        // Too short, probably accidental key press
        this.barcodeBuffer = '';
      }
      this.barcodeTimer = null;
    }, this.BARCODE_TIMEOUT);
  }

  /**
   * Scan barcode and add to list
   */
  scanBarcode(): void {
    if (!this.barcodeInput || this.barcodeInput.trim() === '') {
      this.notificationService.showError('Please enter a barcode');
      return;
    }

    const barcode = this.barcodeInput.trim();
    
    // Check for duplicate
    if (this.scannedPackages.some(pkg => pkg.barcode === barcode)) {
      this.notificationService.showError(`Package ${barcode} is already in the list`);
      this.barcodeInput = '';
      // Refocus input after clearing
      setTimeout(() => {
        if (this.barcodeInputRef && !this.isMobile) {
          this.barcodeInputRef.nativeElement.focus();
        }
      }, 100);
      return;
    }

    // Lookup barcode
    this.inventoryService.getInventoryByBarcode(barcode).subscribe(
      (response: any) => {
        // Validate it's a sub-item that can be processed further
        // Sub-items can be processed further regardless of whether they're:
        // 1. From packages table (is_package = true) - processed packages
        // 2. From inventory directly (is_sub_item = true) - sub-items in inventory
        const isPackage = response.is_package === true;
        const isSubItem = response.item && response.item.is_sub_item === true;
        
        if (!isPackage && !isSubItem) {
          this.notificationService.showError('This barcode is not a sub-item. Only sub-items can be processed further.');
          this.barcodeInput = '';
          // Refocus input after clearing
          setTimeout(() => {
            if (this.barcodeInputRef && !this.isMobile) {
              this.barcodeInputRef.nativeElement.focus();
            }
          }, 100);
          return;
        }

        // Check if this is a mixed mode package and warn the user
        if (response.is_mixed_mode === true) {
          this.notificationService.showWarning(
            'Warning: This package is from mixed mode processing (contains multiple source items). ' +
            'Unpackaging mixed mode packages is not supported. Please contact support if you need to unpackage this item.'
          );
          this.barcodeInput = '';
          // Refocus input after clearing
          setTimeout(() => {
            if (this.barcodeInputRef && !this.isMobile) {
              this.barcodeInputRef.nativeElement.focus();
            }
          }, 100);
          return;
        }

        this.addPackageToList(response);
        this.barcodeInput = '';
        
        // Refocus input after adding package to allow continuous scanning
        setTimeout(() => {
          if (this.barcodeInputRef && !this.isMobile) {
            this.barcodeInputRef.nativeElement.focus();
          }
        }, 100);
      },
      (error) => {
        if (error.status === 404) {
          this.notificationService.showError('Barcode not found: ' + barcode);
        } else {
          this.notificationService.showError('Error looking up barcode: ' + (error.error?.message || error.message));
        }
        this.barcodeInput = '';
        // Refocus input after error
        setTimeout(() => {
          if (this.barcodeInputRef && !this.isMobile) {
            this.barcodeInputRef.nativeElement.focus();
          }
        }, 100);
      }
    );
  }

  /**
   * Add package to scanned list
   */
  private addPackageToList(barcodeData: any): void {
    const scannedPackage: ScannedPackage = {
      barcode: barcodeData.barcode,
      item: barcodeData.item,
      net_quantity: barcodeData.available_quantity.value,
      unit: barcodeData.available_quantity.unit,
      rate: barcodeData.rate,
      packaging_weight: barcodeData.packaging_weight
    };

    this.scannedPackages.push(scannedPackage);
  }

  /**
   * Remove package from list
   */
  removePackage(index: number): void {
    this.scannedPackages.splice(index, 1);
  }

  /**
   * Get total quantity of all scanned packages
   */
  getTotalQuantity(): number {
    return this.scannedPackages.reduce((total, pkg) => total + pkg.net_quantity, 0);
  }

  /**
   * Get total unit (assumes all packages have same unit)
   */
  getTotalUnit(): string {
    return this.scannedPackages.length > 0 ? this.scannedPackages[0].unit : 'KG';
  }

  /**
   * Open barcode scanner for mobile
   */
  async openBarcodeScanner(): Promise<void> {
    const barcode = await this.barcodeScannerService.scanBarcodeWithCamera();
    if (barcode) {
      this.barcodeInput = barcode;
      this.scanBarcode();
      // scanBarcode() will clear the input after processing
    }
  }

  /**
   * Submit to process further
   * This just unpackages the items and moves them to manufacturing.
   * The actual processing type will be selected when adding the sub-item from Manufacturing list.
   */
  submitProcessFurther(): void {
    if (this.scannedPackages.length === 0) {
      this.notificationService.showError('Please scan at least one package');
      return;
    }
    
    // Prepare data for backend
    // No processing_type_id needed - just unpackage and move to manufacturing
    const processData = {
      packages: this.scannedPackages.map(pkg => ({
        package_barcode: pkg.barcode,
        item_id: pkg.item.item_id,
        net_quantity: pkg.net_quantity,
        unit: pkg.unit,
        rate: pkg.rate
      }))
    };

    this.processFurther.next(processData);
    this.modalRef.hide();
  }
}

