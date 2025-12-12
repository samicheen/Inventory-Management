import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ControlContainer } from  '@angular/forms';
import { InventoryItem } from '../../models/inventory-item.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject, forkJoin } from 'rxjs';
import { Purchase } from '../../models/purchase.model';
import { Item } from '../../models/item.model';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { ItemService } from '../../services/item/item.service';
import { PartyService } from '../../services/party/party.service';
import { Party } from '../../models/party.model';
import { PurchaseService } from '../../services/purchase/purchase.service';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.scss']
})
export class AddPurchaseComponent implements OnInit {
  purchase: Purchase; // Removed @Input() - ngx-bootstrap assigns from initialState

  parties: Party[];
  items: Item[];
  addPurchaseForm: FormGroup;
  selectedItemId: string;
  selectedVendorId: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  savePurchase: Subject<InventoryItem>;
  saveAndPrintPurchases: Subject<Purchase>;
  selectedVal: any;
  minQuantity: number = 0; // Minimum quantity based on processed items (for edit mode)
  processedInfo: any = null; // Info about processed quantities (for display)
  
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef,
              private partyService: PartyService,
              private itemService: ItemService,
              private purchaseService: PurchaseService) { }

  get selectedVendor(): FormControl {
    return this.addPurchaseForm.get('selected_vendor') as FormControl;
  }

  get selectedItem(): FormControl {
    return this.addPurchaseForm.get('selected_item') as FormControl;
  }

  get value(): FormControl {
    return this.addPurchaseForm.get('quantity.value') as FormControl;
  }

  get rate(): FormControl {
    return this.addPurchaseForm.get('rate') as FormControl;
  }

  ngOnInit(): void {
    this.savePurchase = new Subject();
    this.saveAndPrintPurchases = new Subject();
    
    // Initialize form immediately with empty/default values
    this.addPurchaseForm = this.formBuilder.group({
      invoice_id: '',
      selected_vendor: ['', Validators.required],
      selected_item: ['', Validators.required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: [QuantityUnit.KG, Validators.required]
      }),
      rate: ['', Validators.required],
      timestamp: [new Date()]
    });
    
    // Load parties and items, then populate form with purchase data
    forkJoin({
      parties: this.partyService.getParties('vendor'),
      items: this.itemService.getItems()
    }).subscribe(({ parties, items }) => {
      this.parties = parties.items;
      this.items = items.items;
      this.populateForm();
      
      // If editing, fetch processed quantities for validation hint
      if (this.purchase?.purchase_id && this.purchase?.barcode) {
        this.loadProcessedQuantities();
      }
    });
    
    // Add custom validator for quantity when editing
    this.value.valueChanges.subscribe(() => {
      this.validateQuantity();
    });
  }

  private populateForm(): void {
    if (!this.purchase) {
      return; // No purchase data, form stays empty
    }

    // Get vendor name string (fix [object Object] issue)
    const vendorName = this.purchase.vendor?.name || '';
    const vendor = this.parties?.find(v => v.name === vendorName);
    this.selectedVendorId = vendor?.party_id || null;

    // Get item display string (fix [object Object] issue)
    let itemDisplay = '';
    if (this.purchase.item?.name) {
      itemDisplay = `${this.purchase.item.name} Grade: ${this.purchase.item.grade} Size: ${this.purchase.item.size}`;
      const item = this.items?.find(i => 
        i.name === this.purchase.item.name && 
        i.grade === this.purchase.item.grade && 
        i.size === this.purchase.item.size
      );
      this.selectedItemId = item?.item_id || null;
    }

    // Parse timestamp
    let timestampValue = new Date();
    if (this.purchase.timestamp) {
      const ts = String(this.purchase.timestamp).replace(' UTC', '');
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime())) {
        timestampValue = parsed;
      }
    }

    // Populate form with purchase data
    this.addPurchaseForm.patchValue({
      invoice_id: this.purchase.invoice_id || '',
      selected_vendor: vendorName,
      selected_item: itemDisplay,
      quantity: {
        value: this.purchase.quantity?.value || '',
        unit: this.purchase.quantity?.unit || QuantityUnit.KG
      },
      rate: this.purchase.rate || '',
      timestamp: timestampValue
    });
  }

  onSelectItem(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.addPurchaseForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }

  onSelectVendor(event: TypeaheadMatch): void {
    this.selectedVendorId = event.item.party_id;
  }

  nextItem() {

  }

  applyToNext() {

  }

  doneAndPrintLabels() {
    // Validate quantity before submit (if editing)
    if (this.purchase?.purchase_id && this.minQuantity > 0) {
      const enteredQuantity = parseFloat(this.value.value) || 0;
      if (enteredQuantity < this.minQuantity) {
        this.value.setErrors({ minQuantity: true });
        this.value.markAsTouched();
        return;
      }
    }
    
    // Ensure item is selected
    if (!this.selectedItemId) {
      this.selectedItem.markAsTouched();
      this.selectedItem.setErrors({ required: true });
      return;
    }
    
    if(this.addPurchaseForm.valid) {
       // Get selected item details for print labels
       const selectedItem = this.items?.find(i => i.item_id === this.selectedItemId);
       
       const purchase = {
         ...this.addPurchaseForm.value,
         purchase_id: this.purchase?.purchase_id, // Include purchase_id if editing
         vendor_id: this.selectedVendorId,
         item_id: this.selectedItemId,
         item: {
           name: selectedItem?.name || '',
           grade: selectedItem?.grade || '',
           size: selectedItem?.size || ''
         },
         amount: (this.addPurchaseForm.value.quantity.value * this.addPurchaseForm.value.rate).toFixed(2)
       }
       this.saveAndPrintPurchases.next(purchase);
       this.modalRef.hide();
    } else {
      this.addPurchaseForm.markAllAsTouched();
    }
  }

  /**
   * Load processed quantities for this purchase (for edit mode validation)
   */
  private loadProcessedQuantities(): void {
    if (!this.purchase?.barcode) {
      return;
    }
    
    this.purchaseService.getProcessedQuantities(this.purchase.barcode).subscribe(
      (response: any) => {
        this.processedInfo = response;
        this.minQuantity = response.total_processed || 0;
      },
      (error) => {
        console.error('Error loading processed quantities:', error);
        // Don't block editing if we can't fetch this info - backend will validate
      }
    );
  }

  /**
   * Validate quantity against minimum (processed items)
   */
  private validateQuantity(): void {
    if (!this.purchase?.purchase_id || this.minQuantity === 0) {
      return; // Not editing or no minimum
    }
    
    const enteredQuantity = parseFloat(this.value.value) || 0;
    if (enteredQuantity > 0 && enteredQuantity < this.minQuantity) {
      this.value.setErrors({ minQuantity: true });
    } else if (this.value.errors?.minQuantity) {
      // Remove minQuantity error if valid now
      const errors = { ...this.value.errors };
      delete errors.minQuantity;
      this.value.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }
}
