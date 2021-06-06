import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ControlContainer } from  '@angular/forms';
import { InventoryItem } from '../../models/inventory-item.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { Purchase } from '../../models/purchase.model';
import { Item } from '../../models/item.model';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { ItemService } from '../../services/item/item.service';
import { PartyService } from '../../services/party/party.service';
import { Party } from '../../models/party.model';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.scss']
})
export class AddPurchaseComponent implements OnInit {
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
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef,
              private partyService: PartyService,
              private itemService: ItemService) { }

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
    this.partyService.getParties('vendor').subscribe((response) => {
      this.parties = response.items;
    });
    this.itemService.getItems().subscribe((response) => {
      this.items = response.items;
    });
    this.savePurchase = new Subject();
    this.saveAndPrintPurchases = new Subject();
    this.addPurchaseForm  =  this.formBuilder.group({
      invoice_id: '',
      selected_vendor: ['', Validators.required],
      selected_item: ['', Validators. required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: QuantityUnit.KG
      }),
      rate: ['', Validators.required],
      timestamp: [new Date()]
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
    if(this.addPurchaseForm.valid) {
       const purchase = {
         ...this.addPurchaseForm.value,
         vendor_id: this.selectedVendorId,
         item_id: this.selectedItemId,
         amount: (this.addPurchaseForm.value.quantity.value * this.addPurchaseForm.value.rate).toFixed(2)
       }
       this.saveAndPrintPurchases.next(purchase);
       this.modalRef.hide();
    } else {
      this.addPurchaseForm.markAllAsTouched();
    }
  }
}
