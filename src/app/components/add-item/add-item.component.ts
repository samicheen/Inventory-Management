import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from  '@angular/forms';
import { Item, QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/item.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent implements OnInit {
  addItemForm: FormGroup;
  items: Item[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveItem: Subject<Item>;
  saveAndPrintItems: Subject<Item>;
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get vendor(): FormControl {
    return this.addItemForm.get('vendor') as FormControl;
  }

  get itemName(): FormControl {
    return this.addItemForm.get('item_name') as FormControl;
  }

  get grade(): FormControl {
    return this.addItemForm.get('grade') as FormControl;
  }

  get size(): FormControl {
    return this.addItemForm.get('size') as FormControl;
  }

  get value(): FormControl {
    return this.addItemForm.get('quantity.value') as FormControl;
  }

  get rate(): FormControl {
    return this.addItemForm.get('rate') as FormControl;
  }

  ngOnInit(): void {
    this.saveItem = new Subject();
    this.saveAndPrintItems = new Subject();
    this.addItemForm  =  this.formBuilder.group({
      invoice_number: '',
      vendor: ['', Validators.required],
      item_name: ['', Validators.required],
      grade: ['', Validators.required],
      size: ['', [Validators.required,
                 Validators.pattern(/^\d+\.\d{1}$/)]],
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
    if(this.addItemForm.valid) {
       const item = {
         ...this.addItemForm.value,
         amount: (this.addItemForm.value.quantity.value * this.addItemForm.value.rate).toFixed(2),
         timestamp: new Date().toISOString()
       }
       this.saveAndPrintItems.next(item);
       this.modalRef.hide();
    } else {
      this.addItemForm.markAllAsTouched();
    }
  }
}
