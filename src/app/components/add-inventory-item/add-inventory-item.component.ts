import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
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
  selectedItemId: string;
  addInventoryItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveAndPrintInventoryItems: Subject<InventoryItem>;
  processingTypes = [
    { value: 'cut', label: 'S-Cut', charge: 20 },
    { value: 'conditioned', label: 'Conditioned', charge: 5 }
  ];
  availableQuantity: any = null; // From manufacturing entry
  sourceRate: number = 0; // Source rate from purchase/inventory

  constructor(private formBuilder: FormBuilder,
              private itemService: ItemService,
              private inventoryService: InventoryService,
              public modalRef: BsModalRef) { }

  get selectedItem(): FormControl {
    return this.addInventoryItemForm.get('selected_item') as FormControl;
  }

  get value(): FormControl {
    return this.addInventoryItemForm.get('quantity.value') as FormControl;
  }

  get quantity(): FormControl {
    return this.addInventoryItemForm.get('quantity') as FormControl;
  }

  get rate(): FormControl {
    return this.addInventoryItemForm.get('rate') as FormControl;
  }

  get timestamp(): FormControl {
    return this.addInventoryItemForm.get('timestamp') as FormControl;
  }

  get processingType(): FormControl {
    return this.addInventoryItemForm.get('processing_type') as FormControl;
  }


  ngOnInit(): void {
    // Set available quantity from manufacturing entry
    if (this.manufactureEntry) {
      this.availableQuantity = this.manufactureEntry.quantity;
    }
    
    // Initialize form
    this.saveAndPrintInventoryItems = new Subject();
    const quantityValidators = [Validators.required];
    if (this.availableQuantity?.value) {
      quantityValidators.push(Validators.max(this.availableQuantity.value));
    }
    
    this.addInventoryItemForm = this.formBuilder.group({
      selected_item: ['', Validators.required],
      processing_type: ['', Validators.required], // Required - must select S-Cut or Conditioned
      quantity: this.formBuilder.group({
        value: [this.availableQuantity?.value || '', quantityValidators],
        unit: [this.availableQuantity?.unit || QuantityUnit.KG]
      }),
      rate: [{value: '', disabled: true}], // Auto-calculated, read-only
      timestamp: [new Date()],
    });

    // Get sub-items only (for processing) - filtered in backend
    this.itemService.getItems(true).subscribe((response) => {
      this.items = response.items;
      console.log('Loaded sub-items:', this.items.length, this.items); // Debug: Check if items are loaded
    }, (error) => {
      console.error('Error loading items:', error);
      this.items = [];
    });

    // Auto-calculate rate when processing type changes
    this.processingType.valueChanges.subscribe(() => {
      if (this.sourceRate > 0) {
        this.calculateRate();
      }
    });
    
    // Get source rate from source_barcode (after form is initialized)
    // Note: For manufacturing entries, use the manufacturing quantity (not inventory stock)
    if (this.manufactureEntry?.source_barcode) {
      this.inventoryService.getInventoryByBarcode(this.manufactureEntry.source_barcode).subscribe(
        (response: any) => {
          // Ensure rate is a number
          this.sourceRate = typeof response.rate === 'string' ? parseFloat(response.rate) : (response.rate || 0);
          
          // IMPORTANT: Use manufacturing entry quantity (not inventory stock) for validation
          // The manufacturing entry shows how much is actually available for processing
          // Inventory stock might be higher (original purchase), but manufacturing quantity is what's left
          if (this.manufactureEntry?.quantity) {
            // Keep the manufacturing entry quantity as available (don't overwrite with inventory stock)
            this.availableQuantity = this.manufactureEntry.quantity;
            
            // Update form validators with manufacturing quantity
            const quantityValidators = [Validators.required];
            if (this.availableQuantity.value) {
              quantityValidators.push(Validators.max(this.availableQuantity.value));
            }
            this.value.setValidators(quantityValidators);
            this.value.updateValueAndValidity();
            
            // Also update the form value if it exceeds the max
            if (this.value.value > this.availableQuantity.value) {
              this.value.setValue(this.availableQuantity.value);
            }
          }
          
          // Calculate rate immediately if processing type is already selected
          if (this.processingType.value) {
            setTimeout(() => this.calculateRate(), 100);
          }
        },
        (error) => {
          console.error('Error fetching source rate:', error);
          this.sourceRate = 0;
        }
      );
    }
  }

  calculateRate(): void {
    if (this.sourceRate > 0 && this.processingType.value) {
      const processingType = this.processingTypes.find(pt => pt.value === this.processingType.value);
      const processingCharge = processingType ? processingType.charge : 0;
      // Ensure sourceRate is a number
      const sourceRateNum = typeof this.sourceRate === 'string' ? parseFloat(this.sourceRate) : (this.sourceRate || 0);
      const newRate = sourceRateNum + processingCharge;
      
      // Enable the field temporarily to update it, then disable again
      this.rate.enable({ emitEvent: false });
      this.addInventoryItemForm.patchValue({
        rate: newRate.toFixed(2)
      }, { emitEvent: false });
      this.rate.disable({ emitEvent: false });
    } else {
      // Clear rate if conditions not met
      this.rate.enable({ emitEvent: false });
      this.addInventoryItemForm.patchValue({
        rate: ''
      }, { emitEvent: false });
      this.rate.disable({ emitEvent: false });
    }
  }


  doneAndPrintLabels() {
    if(this.addInventoryItemForm.valid) {
      const formValue = this.addInventoryItemForm.getRawValue(); // Get disabled field values too
      const item = {
        item: {
          parent_item_id: this.parentItem?.item_id,
          item_id: this.selectedItemId
        },
        source_barcode: this.manufactureEntry?.source_barcode || null, // From manufacturing entry
        processing_type: formValue.processing_type, // S-Cut or Conditioned (required)
        closing_stock: this.quantity.value, // Processed quantity
        rate: formValue.rate || this.rate.value,
        closing_amount: (this.value.value * (formValue.rate || this.rate.value)).toFixed(2),
        timestamp: this.timestamp.value
      } as any;
      this.saveAndPrintInventoryItems.next(item);
      this.modalRef.hide();
    } else {
      this.addInventoryItemForm.markAllAsTouched();
    }
  }

  onSelect(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.addInventoryItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }

}
