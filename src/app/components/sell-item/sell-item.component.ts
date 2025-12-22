import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from '../../models/item.model';
import { Sale } from '../../models/sale.model';
import { ItemService } from '../../services/item/item.service';
import { Party } from '../../models/party.model';
import { PartyService } from '../../services/party/party.service';

@Component({
  selector: 'app-sell-item',
  templateUrl: './sell-item.component.html',
  styleUrls: ['./sell-item.component.scss']
})
export class SellItemComponent implements OnInit {
  @Input() item: Item;
  @Input() barcode?: string; // From barcode scan
  @Input() availableQuantity?: any; // Pre-filled from barcode scan
  @Input() rate?: number; // Pre-filled from barcode scan
  parties: Party[];
  items: Item[];
  selectedCustomerId: string;
  selectedCustomerObj: Party; // Store the selected customer object
  selectedItemId: string;
  selectedItemObj: Item; // Store the selected item object
  sellItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  sell: Subject<Sale>;

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef,
              private partyService: PartyService,
              private itemService: ItemService) { }

  get selectedCustomer(): FormControl {
    return this.sellItemForm.get('selected_customer') as FormControl;
  }

  get selectedItem(): FormControl {
    return this.sellItemForm.get('selected_item') as FormControl;
  }

  get value(): FormControl {
    return this.sellItemForm.get('quantity.value') as FormControl;
  }

  get selling_price(): FormControl {
    return this.sellItemForm.get('selling_price') as FormControl;
  }

  ngOnInit(): void {
    this.partyService.getParties('customer').subscribe((response) => {
      this.parties = response.items;
    });
    this.itemService.getItems().subscribe((response) => {
      this.items = response.items;
    });
    this.sell = new Subject();
    this.sellItemForm  =  this.formBuilder.group({
      invoice_id: '',
      selected_customer: ['', Validators.required],
      selected_item: [this.item? this.item.name + ' Grade: ' + this.item.grade + ' Size: ' + this.item.size : '', Validators. required],
      quantity: this.formBuilder.group({
        value: [this.availableQuantity?.value || '', Validators.required],
        unit: [this.availableQuantity?.unit || QuantityUnit.KG]
      }),
      selling_price:  ['', Validators.required],
      timestamp: [new Date()]
    });
    
    // Pre-fill item ID and object if from barcode scan
    if (this.item && this.item.item_id) {
      this.selectedItemId = this.item.item_id;
      this.selectedItemObj = this.item;
    }
  }

  sellItem() {
    if(this.sellItemForm.valid) {
       // Get customer name from form
       const customerName = this.sellItemForm.value.selected_customer;
       
       // Prioritize selectedCustomerObj if it exists and matches form value (user selected from autofill)
       let selectedCustomer: Party;
       if (this.selectedCustomerObj && this.selectedCustomerObj.name === customerName) {
         selectedCustomer = this.selectedCustomerObj;
       } else {
         // Try to find customer by current form value (handles exact name match)
         selectedCustomer = this.parties?.find(p => p.name === customerName);
       }
       
       // If still not found, customer is invalid (user typed manually without selecting from autofill)
       if (!selectedCustomer) {
         this.selectedCustomer.setErrors({ customerNotSelected: true });
         this.selectedCustomer.markAsTouched();
         return;
       }
       
       // Get item - prioritize @Input (barcode scan), then selectedItemObj (autofill), then find by matching
       let itemObj: Item;
       if (this.item) {
         // Item was pre-filled from barcode scan
         itemObj = this.item;
       } else if (this.selectedItemObj) {
         // Item was selected from typeahead autofill - verify form value matches
         const itemFormValue = this.sellItemForm.value.selected_item;
         const expectedFormat = `${this.selectedItemObj.name} Grade: ${this.selectedItemObj.grade} Size: ${this.selectedItemObj.size}`;
         if (itemFormValue === expectedFormat) {
           itemObj = this.selectedItemObj;
         }
       }
       
       // If not found yet, try to find by parsing the form value
       // Form value format: "name Grade: grade Size: size"
       if (!itemObj && this.items) {
         const itemFormValue = this.sellItemForm.value.selected_item;
         if (itemFormValue) {
           // Try to find item by matching the display format
           itemObj = this.items.find(i => {
             const expectedFormat = `${i.name} Grade: ${i.grade} Size: ${i.size}`;
             return expectedFormat === itemFormValue;
           });
         }
       }
       
       // If still not found, try by stored item_id as last resort
       if (!itemObj && this.selectedItemId && this.items) {
         itemObj = this.items.find(i => i.item_id === this.selectedItemId);
       }
       
       // If still not found, item is invalid (user typed manually without selecting from autofill)
       if (!itemObj) {
         this.selectedItem.setErrors({ itemNotSelected: true });
         this.selectedItem.markAsTouched();
         return;
       }
       
       // Structure data to match backend expectations (nested objects)
       const sale = {
         barcode: this.barcode || null, // Include barcode if available (from barcode scan or inventory item)
         invoice_id: this.sellItemForm.value.invoice_id,
         item: {
           item_id: itemObj.item_id
         },
         customer: {
           name: selectedCustomer.name
         },
         quantity: this.sellItemForm.value.quantity,
         selling_price: this.sellItemForm.value.selling_price,
         amount: (this.sellItemForm.value.quantity.value * this.sellItemForm.value.selling_price).toFixed(2),
         timestamp: this.sellItemForm.value.timestamp
       } as any;
       
       this.sell.next(sale);
       this.modalRef.hide();
    } else {
      this.sellItemForm.markAllAsTouched();
    }
  }

  onSelectCustomer(event: TypeaheadMatch): void {
    this.selectedCustomerId = event.item.party_id;
    this.selectedCustomerObj = event.item; // Store the selected customer object
    // Clear any previous errors
    if (this.selectedCustomer.errors) {
      this.selectedCustomer.setErrors(null);
    }
  }

  onSelectItem(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.selectedItemObj = item; // Store the selected item object
    this.sellItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    });
    // Clear any previous errors
    if (this.selectedItem.errors) {
      this.selectedItem.setErrors(null);
    }
  }
}
