import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { InventoryService } from '../../services/inventory/inventory.service';
import { PartyService } from '../../services/party/party.service';
import { NotificationService } from '../../services/notification/notification.service';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';
import { Party } from '../../models/party.model';
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

interface PackageGroup {
  item: any;
  rate: number;
  unit: string;
  packages: ScannedPackage[];
  selling_price: number;
}

@Component({
  selector: 'app-scan-sales-packages',
  templateUrl: './scan-sales-packages.component.html',
  styleUrls: ['./scan-sales-packages.component.scss']
})
export class ScanSalesPackagesComponent implements OnInit, OnDestroy {
  // Properties assigned from initialState by ngx-bootstrap
  initialPackage?: any; // Pre-scanned package from barcode scan
  
  @ViewChild('barcodeInputRef', { static: false }) barcodeInputRef?: ElementRef;
  
  scannedPackages: ScannedPackage[] = [];
  packageGroups: PackageGroup[] = [];
  scanSalesForm: FormGroup;
  parties: Party[] = [];
  barcodeInput: string = '';
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  sell: Subject<any>;
  isMobile = false;
  
  // Barcode scanner detection
  private barcodeBuffer: string = '';
  private barcodeTimer: any = null;
  private readonly BARCODE_TIMEOUT = 100; // ms - barcode scanners type very fast

  constructor(
    private formBuilder: FormBuilder,
    private inventoryService: InventoryService,
    private partyService: PartyService,
    private notificationService: NotificationService,
    private barcodeScannerService: BarcodeScannerService,
    public modalRef: BsModalRef
  ) { }

  get selectedCustomer(): FormControl {
    return this.scanSalesForm.get('selected_customer') as FormControl;
  }

  get invoiceId(): FormControl {
    return this.scanSalesForm.get('invoice_id') as FormControl;
  }

  get timestamp(): FormControl {
    return this.scanSalesForm.get('timestamp') as FormControl;
  }

  get sellingPrices(): FormArray {
    return this.scanSalesForm.get('selling_prices') as FormArray;
  }

  ngOnInit(): void {
    this.sell = new Subject();
    
    // Check if running on native platform (mobile app)
    this.isMobile = Capacitor.isNativePlatform();
    
    // Set default date to today
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    this.scanSalesForm = this.formBuilder.group({
      invoice_id: ['', Validators.required], // Required invoice ID - common for all packages
      timestamp: [today, Validators.required], // Date field with default to today
      selected_customer: ['', Validators.required],
      selling_prices: this.formBuilder.array([])
    });

    // Load parties (customers)
    this.partyService.getParties('customer').subscribe(
      (response) => {
        this.parties = response.items || [];
      },
      (error) => {
        console.error('Error loading parties:', error);
        this.notificationService.showError('Error loading customers.');
      }
    );

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
        // Validate it's a package barcode
        if (!response.is_package) {
          this.notificationService.showError('This barcode is not a packaged item. Only packaged items can be sold.');
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
   * Add package to scanned list and update groups
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
    this.updatePackageGroups();
  }

  /**
   * Group packages by item and rate
   */
  private updatePackageGroups(): void {
    // Clear existing groups
    this.packageGroups = [];
    const sellingPricesArray = this.sellingPrices;
    
    // Group packages by item_id and rate
    const groupsMap = new Map<string, PackageGroup>();
    
    this.scannedPackages.forEach(pkg => {
      const key = `${pkg.item.item_id}_${pkg.rate}_${pkg.unit}`;
      
      if (!groupsMap.has(key)) {
        const group: PackageGroup = {
          item: pkg.item,
          rate: pkg.rate,
          unit: pkg.unit,
          packages: [],
          selling_price: 0
        };
        groupsMap.set(key, group);
        this.packageGroups.push(group);
        
        // Add form control for selling price
        sellingPricesArray.push(this.formBuilder.control(0, [Validators.required, Validators.min(0)]));
      }
      
      groupsMap.get(key)!.packages.push(pkg);
    });
  }

  /**
   * Remove package from list
   */
  removePackage(packageIndex: number): void {
    this.scannedPackages.splice(packageIndex, 1);
    this.updatePackageGroups();
  }

  /**
   * Get total quantity for a group
   */
  getGroupTotalQuantity(group: PackageGroup): number {
    return group.packages.reduce((total, pkg) => total + pkg.net_quantity, 0);
  }

  /**
   * Get total quantity of all packages
   */
  getTotalQuantity(): number {
    return this.scannedPackages.reduce((total, pkg) => total + pkg.net_quantity, 0);
  }

  /**
   * Open barcode scanner for mobile
   */
  async openBarcodeScanner(): Promise<void> {
    const barcode = await this.barcodeScannerService.scanBarcodeWithCamera();
    if (barcode) {
      this.barcodeInput = barcode;
      this.scanBarcode();
    }
  }

  /**
   * Submit to sell all packages
   */
  submitSell(): void {
    if (this.scanSalesForm.invalid) {
      this.scanSalesForm.markAllAsTouched();
      return;
    }

    if (this.scannedPackages.length === 0) {
      this.notificationService.showError('Please scan at least one package');
      return;
    }

    const formValue = this.scanSalesForm.getRawValue();
    const invoiceId = formValue.invoice_id; // Required - common for all packages
    const timestamp = formValue.timestamp; // Date for all packages
    const customerId = formValue.selected_customer;
    const sellingPrices = formValue.selling_prices;
    
    // Prepare sales data
    const salesData = this.packageGroups.map((group, index) => ({
      invoice_id: invoiceId, // Common invoice ID for all packages
      timestamp: timestamp, // Common timestamp for all packages
      customer_id: customerId,
      item: group.item,
      packages: group.packages.map(pkg => ({
        barcode: pkg.barcode,
        quantity: pkg.net_quantity,
        unit: pkg.unit
      })),
      selling_price: sellingPrices[index],
      total_quantity: this.getGroupTotalQuantity(group),
      unit: group.unit
    }));

    this.sell.next(salesData);
    this.modalRef.hide();
  }
}

