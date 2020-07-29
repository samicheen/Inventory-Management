import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from  '@angular/forms';
import { Inventory } from 'src/app/models/inventory.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { Purchase } from 'src/app/models/purchase.model';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.scss']
})
export class AddPurchaseComponent implements OnInit {
  addPurchaseForm: FormGroup;
  purchases: Purchase[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  savePurchase: Subject<Inventory>;
  saveAndPrintPurchases: Subject<Purchase>;
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get vendor(): FormControl {
    return this.addPurchaseForm.get('vendor.name') as FormControl;
  }

  get itemName(): FormControl {
    return this.addPurchaseForm.get('item.name') as FormControl;
  }

  get size(): FormControl {
    return this.addPurchaseForm.get('item.size') as FormControl;
  }

  get grade(): FormControl {
    return this.addPurchaseForm.get('item.grade') as FormControl;
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
    this.addPurchaseForm  =  this.formBuilder.group({
      invoice_id: '',
      vendor: this.formBuilder.group({
        name: ['', Validators.required]
      }),
      item: this.formBuilder.group({
        name: ['', Validators.required],
        size: ['', [Validators.required,
          Validators.pattern(/^\d+\.\d{1}$/)]],
        grade: ['', Validators.required]
      }),
      quantity: this.formBuilder.group({
        value: ['', [Validators.required,
                    Validators.pattern(/^[0-9]*$/)]],
        unit: QuantityUnit.KG
      }),
      rate: ['', [Validators.required,
                 Validators.pattern(/^\d+\.\d{2}$/)]]
    });
  }

  nextItem() {

  }

  applyToNext() {

  }

  doneAndPrintLabels() {
    if(this.addPurchaseForm.valid) {
       const purchase = {
         ...this.addPurchaseForm.value,
         amount: (this.addPurchaseForm.value.quantity.value * this.addPurchaseForm.value.rate).toFixed(2)
       }
       this.saveAndPrintPurchases.next(purchase);
       this.modalRef.hide();
    } else {
      this.addPurchaseForm.markAllAsTouched();
    }
  }
}
