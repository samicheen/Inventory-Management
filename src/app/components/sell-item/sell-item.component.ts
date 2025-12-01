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
  selectedItemId: string;
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
    
    // Pre-fill item ID if from barcode scan
    if (this.item && this.item.item_id) {
      this.selectedItemId = this.item.item_id;
    }
  }

  sellItem() {
    if(this.sellItemForm.valid) {
       // Get customer name from form or parties array
       const customerName = this.sellItemForm.value.selected_customer;
       
       // Get item - either from @Input or from items array
       let itemObj: Item;
       if (this.item) {
         itemObj = this.item;
       } else if (this.selectedItemId && this.items) {
         itemObj = this.items.find(i => i.item_id === this.selectedItemId);
       }
       
       // Structure data to match backend expectations (nested objects)
       const sale = {
         barcode: this.barcode || null, // Include barcode if available (from barcode scan or inventory item)
         invoice_id: this.sellItemForm.value.invoice_id,
         item: {
           item_id: itemObj ? itemObj.item_id : this.selectedItemId
         },
         customer: {
           name: customerName
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
  }

  onSelectItem(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.sellItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }
}
