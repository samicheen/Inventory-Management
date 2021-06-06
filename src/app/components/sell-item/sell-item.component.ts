import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, TypeaheadMatch } from 'ngx-bootstrap';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from '../../models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from '../../models/item.model';
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
  parties: Party[];
  items: Item[];
  selectedCustomerId: string;
  selectedItemId: string;
  sellItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  sell: Subject<Item>;

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
        value: ['', Validators.required],
        unit: QuantityUnit.KG
      }),
      selling_price:  ['', Validators.required],
      timestamp: [new Date()]
    });
  }

  sellItem() {
    if(this.sellItemForm.valid) {
       const item = {
         customer_id: this.selectedCustomerId,
         item_id: this.item ? this.item.item_id: this.selectedItemId,
         ...this.sellItemForm.value,
         amount: (this.sellItemForm.value.quantity.value * this.sellItemForm.value.selling_price).toFixed(2)
       }
       this.sell.next(item);
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
