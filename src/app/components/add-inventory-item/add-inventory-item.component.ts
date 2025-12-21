import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, AbstractControl } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject, forkJoin } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { InventoryItem } from 'src/app/models/inventory-item.model';
import { ItemService } from 'src/app/services/item/item.service';
import { InventoryService } from 'src/app/services/inventory/inventory.service';
import { ProcessingTypeService } from 'src/app/services/processing-type/processing-type.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { Manufacture } from 'src/app/models/manufacture.model';
import { ManufactureService } from 'src/app/services/manufacture/manufacture.service';

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
  manufacturingEntries: Manufacture[] = []; // All manufacturing entries for source selection (legacy, kept for compatibility)
  availableInventoryItems: InventoryItem[] = []; // All available inventory items for mixed mode source selection
  isMixedMode: boolean[] = []; // Track which packages are in mixed mode

  constructor(
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private inventoryService: InventoryService,
    private processingTypeService: ProcessingTypeService,
    private notificationService: NotificationService,
    private manufactureService: ManufactureService,
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
    this.isMixedMode = [false]; // Initialize mixed mode array

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
      // For processing, load sub-items only (main_item_id is provided by backend)
      this.itemService.getItems(true).subscribe((response) => {
        this.items = response.items;
      }, (error) => {
        console.error('Error loading items:', error);
        this.items = [];
      });
      
      // Load all available inventory items for mixed mode source selection
      // Mixed mode should show all items with available stock, not just manufacturing entries
      const inventoryParams = new Map<string, any>();
      inventoryParams.set('retrieve_sub_items', '1'); // Get sub-items (processed items)
      inventoryParams.set('parent_item_id', ''); // Get all sub-items
      
      this.inventoryService.getInventory(inventoryParams).subscribe(
        (response) => {
          // Filter to only items with available stock (closing_stock > 0)
          this.availableInventoryItems = (response.items || []).filter(
            (item: InventoryItem) => item.closing_stock && Number(item.closing_stock.value) > 0
          );
        },
        (error) => {
          console.error('Error loading inventory items for mixed mode:', error);
          this.availableInventoryItems = [];
        }
      );
      
      // Also load manufacturing entries for backward compatibility (if needed elsewhere)
      this.manufactureService.getManufacturingItems().subscribe(
        (response) => {
          this.manufacturingEntries = response.items || [];
        },
        (error) => {
          console.error('Error loading manufacturing entries:', error);
          this.manufacturingEntries = [];
        }
      );
      
      // Get source rate - always use main item rate for consistency
      // Backend provides main_item_id (already traversed up hierarchy)
      if (this.manufactureEntry?.item?.item_id) {
        // Use main_item_id from backend (no traversal needed in frontend)
        const itemIdToUse = this.manufactureEntry.item.main_item_id 
          ? String(this.manufactureEntry.item.main_item_id) 
          : String(this.manufactureEntry.item.item_id); // Fallback if main_item_id not provided
        
        this.inventoryService.getInventoryRateByItemId(itemIdToUse).subscribe(
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
            console.error('Error fetching source rate by item_id:', error);
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
    // Processing type is required for single source mode, optional for mixed mode (mixing doesn't require processing)
    const processingTypeValidators = this.isInitialStockMode ? [] : []; // Will be conditionally required based on mode
    
    const formGroupConfig: any = {
      selected_item: ['', Validators.required],
      selected_item_id: ['', Validators.required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: [QuantityUnit.KG, Validators.required]
      }),
      package_quantity: [1, [Validators.required, Validators.min(1)]], // Number of packages with same weight
      rate: rateState,
      is_manual_rate: [this.isInitialStockMode], // Allow manual rate entry for initial stock
      is_mixed: [false], // Track if this package uses mixed sources
      sources: this.formBuilder.array([]), // FormArray for multiple sources (mixed items)
      output_item: [''], // Output item for mixed packages (when processing)
      output_item_id: ['']
    };
    
    // Add packaging_weight and processing_type fields for processed items
    if (!this.isInitialStockMode) {
      formGroupConfig.packaging_weight = [0, [Validators.min(0)]];
      formGroupConfig.processing_type = ['', processingTypeValidators]; // Processing type per package
    }
    
    const formGroup = this.formBuilder.group(formGroupConfig);
    
    // Add custom validator to check total weight (weight * package_quantity) against available quantity
    if (!this.isInitialStockMode && this.availableQuantity?.value) {
      const totalWeightValidator = (control: AbstractControl): {[key: string]: any} | null => {
        const packageGroup = control.parent;
        if (!packageGroup) return null;
        
        const weightValue = parseFloat(packageGroup.get('quantity.value')?.value) || 0;
        const packageQuantity = parseInt(packageGroup.get('package_quantity')?.value) || 1;
        const totalWeight = weightValue * packageQuantity;
        const availableQty = this.availableQuantity?.value || 0;
        
        if (totalWeight > availableQty && weightValue > 0) {
          return { maxTotal: { total: totalWeight, available: availableQty } };
        }
        return null;
      };
      
      // Add validator to both quantity.value and package_quantity
      // The validator checks both fields, so when either changes, Angular will re-validate that field
      // No need for cross-validation listeners which can cause infinite loops
      formGroup.get('quantity.value')?.setValidators([...quantityValidators, totalWeightValidator]);
      formGroup.get('package_quantity')?.setValidators([
        Validators.required, 
        Validators.min(1),
        totalWeightValidator
      ]);
    }
    
    return formGroup;
  }

  createSourceFormGroup(): FormGroup {
    return this.formBuilder.group({
      manufacture_id: [''], // Optional - for manufacturing entries
      source_barcode: [''],
      item_id: ['', Validators.required], // Required - item_id from inventory
      item_name: [''],
      available_quantity: [0],
      quantity: ['', [Validators.required, Validators.min(0.01)]],
      rate: [0]
    });
  }

  getSources(packageIndex: number): FormArray {
    return this.packages.at(packageIndex).get('sources') as FormArray;
  }

  toggleMixedMode(packageIndex: number): void {
    if (this.isInitialStockMode) return; // Mixed mode only for processing
    
    this.isMixedMode[packageIndex] = !this.isMixedMode[packageIndex];
    const packageGroup = this.packages.at(packageIndex);
    
    if (this.isMixedMode[packageIndex]) {
      // Enable mixed mode: clear single source, add sources FormArray
      packageGroup.patchValue({
        selected_item: '',
        selected_item_id: '',
        quantity: { value: '', unit: QuantityUnit.KG }
      });
      const sources = this.getSources(packageIndex);
      if (sources.length === 0) {
        sources.push(this.createSourceFormGroup());
      }
    } else {
      // Disable mixed mode: clear sources, restore single source
      const sources = this.getSources(packageIndex);
      sources.clear();
      packageGroup.patchValue({
        output_item: '',
        output_item_id: ''
      });
      // Restore default values if manufactureEntry exists
      if (this.manufactureEntry) {
        packageGroup.patchValue({
          selected_item: this.manufactureEntry.item.name + ' Grade: ' + this.manufactureEntry.item.grade + ' Size: ' + this.manufactureEntry.item.size,
          selected_item_id: this.manufactureEntry.item.item_id
        });
      }
    }
    this.updatePackageRate(packageIndex);
    this.updateMixedPackageWeight(packageIndex);
  }

  addSource(packageIndex: number): void {
    const sources = this.getSources(packageIndex);
    sources.push(this.createSourceFormGroup());
    // Update package weight after adding source
    setTimeout(() => this.updateMixedPackageWeight(packageIndex), 0);
  }

  removeSource(packageIndex: number, sourceIndex: number): void {
    const sources = this.getSources(packageIndex);
    if (sources.length > 1) {
      sources.removeAt(sourceIndex);
    }
    this.updatePackageRate(packageIndex);
    this.updateMixedPackageWeight(packageIndex);
  }

  onSelectSource(event: any, packageIndex: number, sourceIndex: number): void {
    const selectedItemId = event.target.value;
    if (!selectedItemId) return;
    
    // Find the inventory item by item_id
    const inventoryItem = this.availableInventoryItems.find(
      inv => inv.item?.item_id?.toString() === selectedItemId
    );
    if (!inventoryItem) return;
    
    const sourceGroup = this.getSources(packageIndex).at(sourceIndex);
    
    // Use the inventory item's rate and available quantity
    const rate = inventoryItem.rate ? parseFloat(inventoryItem.rate.toString()) : 0;
    const availableQty = inventoryItem.closing_stock ? Number(inventoryItem.closing_stock.value) : 0;
    
    sourceGroup.patchValue({
      manufacture_id: null, // Not using manufacture_id for inventory items
      source_barcode: inventoryItem.source_barcode || '',
      item_id: inventoryItem.item.item_id,
      item_name: `${inventoryItem.item.name} Grade: ${inventoryItem.item.grade} Size: ${inventoryItem.item.size}`,
      available_quantity: availableQty,
      rate: rate
    });
    
    this.updatePackageRate(packageIndex);
    this.updateMixedPackageWeight(packageIndex);
  }

  addPackage(): void {
    this.packages.push(this.createPackageFormGroup());
    this.isMixedMode.push(false); // Initialize mixed mode for new package
  }

  removePackage(index: number): void {
    if (this.packages.length > 1) {
      this.packages.removeAt(index);
      this.isMixedMode.splice(index, 1);
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
    const isMixed = this.isMixedMode[index];
    
    let sourceRateNum = 0;
    
    if (isMixed) {
      // Mixed items: Just calculate weighted average - NO processing charge
      // Mixing is just combining and packing, no processing involved
      const sources = this.getSources(index);
      let totalQuantity = 0;
      let totalAmount = 0;
      
      sources.controls.forEach(sourceControl => {
        const quantity = parseFloat(sourceControl.get('quantity')?.value) || 0;
        const rate = parseFloat(sourceControl.get('rate')?.value) || 0; // This rate already includes source item's processing charge
        if (quantity > 0 && rate > 0) {
          totalQuantity += quantity;
          totalAmount += quantity * rate;
        }
      });
      
      if (totalQuantity > 0) {
        sourceRateNum = totalAmount / totalQuantity; // Weighted average of source rates (no additional processing charge)
      }
      
      // Also update package weight from sum of source quantities
      this.updateMixedPackageWeight(index);
    } else {
      // Single source mode: Add processing charge if processing type is selected
      // Always use main item rate + full processing charge for consistency
      if (!processingTypeId) return;
      
      const processingType = this.processingTypes.find(pt => pt.value === Number(processingTypeId));
      const processingCharge = processingType ? processingType.charge : 0;
      
      // sourceRate is already the main item rate (backend/frontend handles getting parent rate if needed)
      sourceRateNum = typeof this.sourceRate === 'string' ? parseFloat(this.sourceRate) : (this.sourceRate || 0);
      
      if (sourceRateNum > 0) {
        // Always add full processing charge (consistent calculation regardless of source)
        sourceRateNum = sourceRateNum + processingCharge;
      }
    }
    
    if (sourceRateNum > 0) {
      const rateControl = packageGroup.get('rate');
      rateControl?.enable({ emitEvent: false });
      packageGroup.patchValue({ rate: sourceRateNum.toFixed(2) }, { emitEvent: false });
      rateControl?.disable({ emitEvent: false });
    }
  }

  /**
   * Update package weight from sum of source quantities in mixed mode
   */
  updateMixedPackageWeight(index: number): void {
    if (this.isInitialStockMode) return;
    
    const packageGroup = this.packages.at(index);
    const isMixed = this.isMixedMode[index];
    
    if (isMixed) {
      const sources = this.getSources(index);
      let totalSourceQuantity = 0;
      
      // Calculate total from all sources - use getRawValue to get actual values
      sources.controls.forEach(sourceControl => {
        const sourceValue = sourceControl.getRawValue();
        const quantity = parseFloat(sourceValue.quantity) || 0;
        if (quantity > 0) {
          totalSourceQuantity += quantity;
        }
      });
      
      // Auto-update package weight field with sum of source quantities
      const quantityGroup = packageGroup.get('quantity') as FormGroup;
      if (quantityGroup) {
        const quantityValueControl = quantityGroup.get('value');
        if (quantityValueControl) {
          // Enable if disabled, then set value
          if (quantityValueControl.disabled) {
            quantityValueControl.enable({ emitEvent: false });
          }
          const valueToSet = totalSourceQuantity > 0 ? totalSourceQuantity.toFixed(2) : '0.00';
          quantityValueControl.setValue(valueToSet, { emitEvent: false });
          // Keep enabled - readonly is handled in template via [readonly] attribute
        }
      }
      
      // Set packaging_weight to 0 for mixed mode
      packageGroup.patchValue({ 
        packaging_weight: 0
      }, { emitEvent: false });
    } else {
      // Re-enable quantity input when not in mixed mode (already enabled, just ensure it's not disabled)
      const quantityGroup = packageGroup.get('quantity') as FormGroup;
      if (quantityGroup) {
        const quantityValueControl = quantityGroup.get('value');
        if (quantityValueControl && quantityValueControl.disabled) {
          quantityValueControl.enable({ emitEvent: false });
        }
      }
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
      // Validate mixed packages
      for (let i = 0; i < this.packages.length; i++) {
        if (this.isMixedMode[i]) {
          const packageGroup = this.packages.at(i);
          const sources = this.getSources(i);
          const outputItemId = packageGroup.get('output_item_id')?.value;
          
          if (!outputItemId) {
            this.notificationService.showError(`Package #${i + 1}: Please select output item for mixed package.`);
            return;
          }
          
          if (sources.length === 0) {
            this.notificationService.showError(`Package #${i + 1}: Please add at least one source.`);
            return;
          }
          
          // Validate source quantities
          let totalSourceQuantity = 0;
          sources.controls.forEach((sourceControl, idx) => {
            const quantity = parseFloat(sourceControl.get('quantity')?.value) || 0;
            const available = parseFloat(sourceControl.get('available_quantity')?.value) || 0;
            if (quantity > available) {
              this.notificationService.showError(`Package #${i + 1}, Source #${idx + 1}: Quantity exceeds available (${available}).`);
              return;
            }
            totalSourceQuantity += quantity;
          });
          
          // Validate total source quantity matches package quantity
          const packageQuantity = parseFloat(packageGroup.get('quantity.value')?.value) || 0;
          if (Math.abs(totalSourceQuantity - packageQuantity) > 0.01) {
            this.notificationService.showError(`Package #${i + 1}: Total source quantity (${totalSourceQuantity}) must match package quantity (${packageQuantity}).`);
            return;
          }
        }
      }
      
      // For processing mode, validate total quantity against available quantity (single source mode only)
      if (!this.isInitialStockMode && this.availableQuantity?.value) {
        let totalQuantity = 0;
        this.packages.controls.forEach((control, index) => {
          if (!this.isMixedMode[index]) {
            const quantityValue = parseFloat(control.get('quantity.value')?.value) || 0;
            const packageQuantity = parseInt(control.get('package_quantity')?.value) || 1;
            totalQuantity += quantityValue * packageQuantity;
          }
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
        const isMixed = this.isMixedMode[index];
        const quantityValue = parseFloat(packageGroup.get('quantity.value')?.value) || 0;
        const rateValue = parseFloat(packageGroup.get('rate')?.value) || 0;
        const packageQuantity = parseInt(packageGroup.get('package_quantity')?.value) || 1;
        const packagingWeight = !this.isInitialStockMode && pkg.quantity?.unit === 'KG' 
          ? parseFloat(packageGroup.get('packaging_weight')?.value) || 0 
          : 0;
        
        // For mixed packages, use output_item_id; for single source, use selected_item_id
        const itemId = isMixed ? pkg.output_item_id : pkg.selected_item_id;
        
        // Collect sources for mixed packages
        // Support both manufacture_id (for manufacturing entries) and item_id (for inventory items)
        const sources = isMixed ? this.getSources(index).value.map((src: any) => ({
          manufacture_id: src.manufacture_id || null, // May be null if using inventory items
          source_barcode: src.source_barcode || '',
          item_id: src.item_id, // Required - either from manufacture or directly from inventory
          quantity: parseFloat(src.quantity) || 0
        })) : null;
        
        return {
          item: {
            item_id: itemId,
            parent_item_id: this.parentItem?.item_id || null
          },
          source_barcode: isMixed ? null : (this.manufactureEntry?.source_barcode || null), // For mixed, source_barcode is in sources array
          manufacture_id: isMixed ? null : (this.manufactureEntry?.manufacture_id || null), // Use manufacture_id to identify specific manufacturing entry
          sources: sources, // Array of sources for mixed packages
          processing_type: this.isInitialStockMode ? null : (pkg.processing_type || null),
          closing_stock: {
            value: quantityValue,
            unit: pkg.quantity.unit
          },
          rate: rateValue,
          closing_amount: (quantityValue * rateValue).toFixed(2),
          package_quantity: packageQuantity,
          packaging_weight: packagingWeight,
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
