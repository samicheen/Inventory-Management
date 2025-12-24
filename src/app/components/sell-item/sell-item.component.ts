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
import { QuickAddService } from '../../services/quick-add/quick-add.service';
import { TypeaheadValidationService } from '../../services/typeahead-validation/typeahead-validation.service';

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
              private itemService: ItemService,
              private quickAddService: QuickAddService,
              private typeaheadValidation: TypeaheadValidationService) { }

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
    // Mark all form controls as touched to show validation errors
    this.sellItemForm.markAllAsTouched();
    
    // Get customer name from form
    const customerName = this.sellItemForm.value.selected_customer;
    
    // Validate customer - must be selected from autofill
    const selectedCustomer = this.typeaheadValidation.validateAndGetParty(
      customerName,
      this.selectedCustomerObj,
      this.parties,
      this.selectedCustomer,
      'customerNotSelected'
    );
    
    if (!selectedCustomer) {
      return;
    }
    
    // Get item - prioritize @Input (barcode scan), then validate from autofill
    let itemObj: Item | null = null;
    if (this.item) {
      // Item was pre-filled from barcode scan
      itemObj = this.item;
    } else {
      // Validate item - must be selected from autofill
      const itemFormValue = this.sellItemForm.value.selected_item;
      itemObj = this.typeaheadValidation.validateAndGetItem(
        itemFormValue,
        this.selectedItemObj,
        this.selectedItemId,
        this.items,
        this.selectedItem
      );
    }
    
    // If still not found, item is invalid
    if (!itemObj) {
      return;
    }
    
    if(this.sellItemForm.valid) {
       
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
    }
  }

  onSelectCustomer(event: TypeaheadMatch): void {
    this.selectedCustomerId = event.item.party_id;
    this.selectedCustomerObj = event.item; // Store the selected customer object
    // Immediately validate the selection
    this.validateCustomerField();
  }

  /**
   * Validates the customer field when user types manually (on blur) or when selecting from autofill
   */
  validateCustomerField(): void {
    const customerName = this.sellItemForm.value.selected_customer;
    this.typeaheadValidation.validateAndGetParty(
      customerName,
      this.selectedCustomerObj,
      this.parties,
      this.selectedCustomer,
      'customerNotSelected'
    );
  }

  onSelectItem(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.selectedItemObj = item; // Store the selected item object
    this.sellItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    });
    // Immediately validate the selection
    this.validateItemField();
  }

  /**
   * Validates the item field when user types manually (on blur) or when selecting from autofill
   */
  validateItemField(): void {
    // Skip validation if item was pre-filled from barcode scan
    if (this.item) {
      return;
    }
    
    const itemFormValue = this.sellItemForm.value.selected_item;
    this.typeaheadValidation.validateAndGetItem(
      itemFormValue,
      this.selectedItemObj,
      this.selectedItemId,
      this.items,
      this.selectedItem
    );
  }

  /**
   * Open quick-add modal for customer
   */
  openAddCustomerModal(): void {
    this.quickAddService.openAddPartyModal('customer').subscribe(
      (newCustomer: Party) => {
        // Refresh parties list
        this.partyService.getParties('customer').subscribe((response) => {
          this.parties = response.items;
          // Auto-select the newly added customer
          this.selectedCustomerId = newCustomer.party_id;
          this.selectedCustomerObj = newCustomer;
          this.sellItemForm.patchValue({
            selected_customer: newCustomer.name
          });
          // Clear any errors
          if (this.selectedCustomer.errors) {
            this.selectedCustomer.setErrors(null);
          }
        });
      }
    );
  }

  /**
   * Open quick-add modal for item
   */
  openAddItemModal(): void {
    this.quickAddService.openAddItemModal().subscribe(
      (newItem: Item) => {
        // Refresh items list
        this.itemService.getItems().subscribe((response) => {
          this.items = response.items;
          // Auto-select the newly added item
          this.selectedItemId = newItem.item_id;
          this.selectedItemObj = newItem;
          this.sellItemForm.patchValue({
            selected_item: newItem.name + ' Grade: ' + newItem.grade + ' Size: ' + newItem.size
          });
          // Clear any errors
          if (this.selectedItem.errors) {
            this.selectedItem.setErrors(null);
          }
        });
      }
    );
  }
}
