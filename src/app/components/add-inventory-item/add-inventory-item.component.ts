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
  processingTypes = [
    { value: 'cut', label: 'S-Cut', charge: 20 },
    { value: 'conditioned', label: 'Conditioned', charge: 5 }
  ];
  availableQuantity: any = null; // From manufacturing entry
  sourceRate: number = 0; // Source rate from purchase/inventory
  isInitialStockMode: boolean = false; // True when adding initial stock (no manufactureEntry)

  constructor(private formBuilder: FormBuilder,
              private itemService: ItemService,
              private inventoryService: InventoryService,
              public modalRef: BsModalRef) { }

  get timestamp(): FormControl {
    return this.addInventoryItemForm.get('timestamp') as FormControl;
  }

  get processingType(): FormControl {
    return this.addInventoryItemForm.get('processing_type') as FormControl;
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
    const processingTypeValidators = this.isInitialStockMode ? [] : [Validators.required];
    
    this.addInventoryItemForm = this.formBuilder.group({
      processing_type: ['', processingTypeValidators], // Required only for processing mode
      timestamp: [new Date()],
      packages: this.formBuilder.array([this.createPackageFormGroup()])
    });
    
    this.packages = this.addInventoryItemForm.get('packages') as FormArray;

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
      
      // Auto-calculate rate when processing type changes
      this.processingType.valueChanges.subscribe(() => {
        if (this.sourceRate > 0) {
          this.updateAllPackageRates();
        }
      });
      
      // Get source rate from source_barcode
      if (this.manufactureEntry?.source_barcode) {
        this.inventoryService.getInventoryByBarcode(this.manufactureEntry.source_barcode).subscribe(
          (response: any) => {
            this.sourceRate = typeof response.rate === 'string' ? parseFloat(response.rate) : (response.rate || 0);
            if (this.manufactureEntry?.quantity) {
              this.availableQuantity = this.manufactureEntry.quantity;
            }
            if (this.processingType.value) {
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
    
    return this.formBuilder.group({
      selected_item: ['', Validators.required],
      selected_item_id: ['', Validators.required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: [QuantityUnit.KG, Validators.required]
      }),
      package_quantity: [1, [Validators.required, Validators.min(1)]], // Number of packages with same weight
      rate: rateState,
      is_manual_rate: [this.isInitialStockMode] // Allow manual rate entry for initial stock
    });
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

  updateAllPackageRates(): void {
    if (this.sourceRate > 0 && this.processingType.value) {
      const processingType = this.processingTypes.find(pt => pt.value === this.processingType.value);
      const processingCharge = processingType ? processingType.charge : 0;
      const sourceRateNum = typeof this.sourceRate === 'string' ? parseFloat(this.sourceRate) : (this.sourceRate || 0);
      const newRate = sourceRateNum + processingCharge;
      
      this.packages.controls.forEach(control => {
        const rateControl = control.get('rate');
        rateControl?.enable({ emitEvent: false });
        control.patchValue({ rate: newRate.toFixed(2) }, { emitEvent: false });
        rateControl?.disable({ emitEvent: false });
      });
    }
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
        
        return {
          item: {
            item_id: pkg.selected_item_id,
            parent_item_id: this.parentItem?.item_id || null
          },
          source_barcode: this.manufactureEntry?.source_barcode || null,
          processing_type: this.isInitialStockMode ? null : formValue.processing_type,
          closing_stock: {
            value: quantityValue,
            unit: pkg.quantity.unit
          },
          rate: rateValue,
          closing_amount: (quantityValue * rateValue).toFixed(2),
          package_quantity: packageQuantity, // Number of packages with same weight
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
