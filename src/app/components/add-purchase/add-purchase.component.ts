import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ControlContainer } from  '@angular/forms';
import { InventoryItem } from 'src/app/models/inventory-item.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { Purchase } from 'src/app/models/purchase.model';
import { Item } from 'src/app/models/item.model';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead';
import { ItemService } from 'src/app/services/item/item.service';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.scss']
})
export class AddPurchaseComponent implements OnInit {
  items: Item[];
  addPurchaseForm: FormGroup;
  selectedItemId: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  savePurchase: Subject<InventoryItem>;
  saveAndPrintPurchases: Subject<Purchase>;
  selectedVal: any;
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef,
              private itemService: ItemService) { }

  get vendor(): FormControl {
    return this.addPurchaseForm.get('vendor.name') as FormControl;
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
    this.itemService.getItems().subscribe((response) => {
      this.items = response.items;
    });
    this.savePurchase = new Subject();
    this.saveAndPrintPurchases = new Subject();
    this.addPurchaseForm  =  this.formBuilder.group({
      invoice_id: '',
      vendor: this.formBuilder.group({
        name: ['', Validators.required]
      }),
      selected_item: ['', Validators. required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: QuantityUnit.KG
      }),
      rate: ['', Validators.required],
      timestamp: [new Date()]
    });
  }

  onSelect(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.addPurchaseForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }

  nextItem() {

  }

  applyToNext() {

  }

  doneAndPrintLabels() {
    if(this.addPurchaseForm.valid) {
       const purchase = {
         ...this.addPurchaseForm.value,
         item: {
          item_id: this.selectedItemId
         },
         amount: (this.addPurchaseForm.value.quantity.value * this.addPurchaseForm.value.rate).toFixed(2)
       }
       this.saveAndPrintPurchases.next(purchase);
       this.modalRef.hide();
    } else {
      this.addPurchaseForm.markAllAsTouched();
    }
  }
}
