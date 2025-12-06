import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject, forkJoin } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { InventoryItem } from 'src/app/models/inventory-item.model';
import { ItemService } from 'src/app/services/item/item.service';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { ProcessingTypeService } from 'src/app/services/processing-type/processing-type.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { Manufacture } from 'src/app/models/manufacture.model';

@Component({
  selector: 'app-add-inventory-item',
  templateUrl: './add-inventory-item.component.html',
  styleUrls: ['./add-inventory-item.component.scss']
})
export class AddInventoryItemComponent implements OnInit {
  // Properties assigned from initialState by ngx-bootstrap (no @Input() needed)
  parentItem?: Item;
  manufactureEntry?: Manufacture; // Manufacturing entry with source_barcode, quantity, etc.
  
  items: Item[] = []; // Initialize as empty array
  addInventoryItemForm: FormGroup;
  packages: FormArray;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveAndPrintInventoryItems: Subject<any>; // Changed to accept array of packages
  processingTypes: Array<{value: number, label: string, charge: number}> = [];
  availableQuantity: any = null; // From manufacturing entry
  sourceRate: number = 0; // Source rate from purchase/inventory
  isInitialStockMode: boolean = false; // True when adding initial stock (no manufactureEntry)

  constructor(
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private inventoryService: InventoryService,
    private processingTypeService: ProcessingTypeService,
    private notificationService: NotificationService,
    public modalRef: BsModalRef
  ) { }

  get timestamp(): FormControl {
    return this.addInventoryItemForm.get('timestamp') as FormControl;
  }



  ngOnInit(): void {
    // Determine if this is initial stock mode (no manufactureEntry)
    this.isInitialStockMode = !this.manufactureEntry;
    
    // Set available quantity from manufacturing entry
    if (this.manufactureEntry) {
      this.availableQuantity = this.manufactureEntry.quantity;
    }
    
    // Initialize form
    this.saveAndPrintInventoryItems = new Subject();
    
    // Build form with packages FormArray
    this.addInventoryItemForm = this.formBuilder.group({
      timestamp: [new Date()],
      packages: this.formBuilder.array([this.createPackageFormGroup()])
    });
    
    this.packages = this.addInventoryItemForm.get('packages') as FormArray;

    // Load processing types from master data
    this.processingTypeService.getProcessingTypes().subscribe(
      (response) => {
        this.processingTypes = response.processing_types.map(pt => ({
          value: pt.processing_type_id!,
          label: pt.name,
          charge: pt.processing_charge
        }));
      },
      (error) => {
        console.error('Error loading processing types:', error);
        this.notificationService.showError('Error loading processing types. Please refresh the page.');
        this.processingTypes = [];
      }
    );

    // Load items based on mode
    if (this.isInitialStockMode) {
      // For initial stock, load all items (not just sub-items)
      this.itemService.getItems().subscribe((response) => {
        this.items = response.items;
      }, (error) => {
        console.error('Error loading items:', error);
        this.items = [];
      });
    } else {
      // For processing, load sub-items only
      this.itemService.getItems(true).subscribe((response) => {
        this.items = response.items;
      }, (error) => {
        console.error('Error loading items:', error);
        this.items = [];
      });
      
      // Get source rate from source_barcode
      if (this.manufactureEntry?.source_barcode) {
        this.inventoryService.getInventoryByBarcode(this.manufactureEntry.source_barcode).subscribe(
          (response: any) => {
            this.sourceRate = typeof response.rate === 'string' ? parseFloat(response.rate) : (response.rate || 0);
            if (this.manufactureEntry?.quantity) {
              this.availableQuantity = this.manufactureEntry.quantity;
            }
            // Update rates for all existing packages if they have processing types selected
            if (this.sourceRate > 0) {
              setTimeout(() => this.updateAllPackageRates(), 100);
            }
          },
          (error) => {
            console.error('Error fetching source rate:', error);
            this.sourceRate = 0;
          }
        );
      }
    }
  }

  createPackageFormGroup(): FormGroup {
    const quantityValidators = [Validators.required];
    if (!this.isInitialStockMode && this.availableQuantity?.value) {
      quantityValidators.push(Validators.max(this.availableQuantity.value));
    }
    
    const rateValidators = this.isInitialStockMode ? [Validators.required] : [];
    const rateState = this.isInitialStockMode 
      ? ['', rateValidators] // Enabled for initial stock
      : [{value: '', disabled: true}, rateValidators]; // Disabled for processing
    
    // Build form group with all fields (including packaging_weight and processing_type for processed items)
    const processingTypeValidators = this.isInitialStockMode ? [] : [Validators.required];
    
    const formGroupConfig: any = {
      selected_item: ['', Validators.required],
      selected_item_id: ['', Validators.required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: [QuantityUnit.KG, Validators.required]
      }),
      package_quantity: [1, [Validators.required, Validators.min(1)]], // Number of packages with same weight
      rate: rateState,
      is_manual_rate: [this.isInitialStockMode] // Allow manual rate entry for initial stock
    };
    
    // Add packaging_weight and processing_type fields for processed items
    if (!this.isInitialStockMode) {
      formGroupConfig.packaging_weight = [0, [Validators.min(0)]];
      formGroupConfig.processing_type = ['', processingTypeValidators]; // Processing type per package
    }
    
    return this.formBuilder.group(formGroupConfig);
  }

  addPackage(): void {
    this.packages.push(this.createPackageFormGroup());
  }

  removePackage(index: number): void {
    if (this.packages.length > 1) {
      this.packages.removeAt(index);
    }
  }

  onSelectItem(event: TypeaheadMatch, index: number): void {
    const item = event.item;
    const packageGroup = this.packages.at(index);
    packageGroup.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size,
      selected_item_id: item.item_id
    });
    
    // For initial stock, if item has a rate, pre-fill it (but keep it editable)
    if (this.isInitialStockMode && item.rate) {
      packageGroup.patchValue({ rate: item.rate }, { emitEvent: false });
    }
  }

  updatePackageRate(index: number): void {
    if (this.isInitialStockMode) return;
    
    const packageGroup = this.packages.at(index);
    const processingTypeId = packageGroup.get('processing_type')?.value;
    
    if (this.sourceRate > 0 && processingTypeId) {
      const processingType = this.processingTypes.find(pt => pt.value === Number(processingTypeId));
      const processingCharge = processingType ? processingType.charge : 0;
      const sourceRateNum = typeof this.sourceRate === 'string' ? parseFloat(this.sourceRate) : (this.sourceRate || 0);
      const newRate = sourceRateNum + processingCharge;
      
      const rateControl = packageGroup.get('rate');
      rateControl?.enable({ emitEvent: false });
      packageGroup.patchValue({ rate: newRate.toFixed(2) }, { emitEvent: false });
      rateControl?.disable({ emitEvent: false });
    }
  }
  
  updateAllPackageRates(): void {
    if (this.isInitialStockMode) return;
    
    this.packages.controls.forEach((control, index) => {
      this.updatePackageRate(index);
    });
  }

  doneAndPrintLabels() {
    if(this.addInventoryItemForm.valid) {
      // For processing mode, validate total quantity against available quantity
      if (!this.isInitialStockMode && this.availableQuantity?.value) {
        let totalQuantity = 0;
        this.packages.controls.forEach(control => {
          const quantityValue = parseFloat(control.get('quantity.value')?.value) || 0;
          const packageQuantity = parseInt(control.get('package_quantity')?.value) || 1;
          totalQuantity += quantityValue * packageQuantity;
        });
        
        if (totalQuantity > this.availableQuantity.value) {
          // Show error on quantity fields
          this.packages.controls.forEach(control => {
            const quantityControl = control.get('quantity.value');
            quantityControl?.setErrors({ maxTotal: true });
            quantityControl?.markAsTouched();
          });
          return;
        }
      }
      
      const formValue = this.addInventoryItemForm.getRawValue();
      const packagesData = this.packages.value.map((pkg: any, index: number) => {
        const packageGroup = this.packages.at(index);
        const quantityValue = parseFloat(packageGroup.get('quantity.value')?.value) || 0;
        const rateValue = parseFloat(packageGroup.get('rate')?.value) || 0;
        const packageQuantity = parseInt(packageGroup.get('package_quantity')?.value) || 1;
        const packagingWeight = !this.isInitialStockMode && pkg.quantity?.unit === 'KG' 
          ? parseFloat(packageGroup.get('packaging_weight')?.value) || 0 
          : 0;
        
        return {
          item: {
            item_id: pkg.selected_item_id,
            parent_item_id: this.parentItem?.item_id || null
          },
          source_barcode: this.manufactureEntry?.source_barcode || null,
          processing_type: this.isInitialStockMode ? null : (pkg.processing_type || null), // Processing type per package
          closing_stock: {
            value: quantityValue,
            unit: pkg.quantity.unit
          },
          rate: rateValue,
          closing_amount: (quantityValue * rateValue).toFixed(2),
          package_quantity: packageQuantity, // Number of packages with same weight
          packaging_weight: packagingWeight, // Packaging weight for processed items
          timestamp: formValue.timestamp
        };
      });
      
      this.saveAndPrintInventoryItems.next({
        packages: packagesData,
        isInitialStock: this.isInitialStockMode
      });
      this.modalRef.hide();
    } else {
      this.addInventoryItemForm.markAllAsTouched();
    }
  }

}
