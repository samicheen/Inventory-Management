import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { SubItemInventory } from 'src/app/models/sub-item-inventory.model';

@Component({
  selector: 'app-add-sub-item',
  templateUrl: './add-sub-item.component.html',
  styleUrls: ['./add-sub-item.component.scss']
})
export class AddSubItemComponent implements OnInit {
  @Input() item: Item;

  addSubItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveAndPrintSubItems: Subject<SubItemInventory>;

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get name(): FormControl {
    return this.addSubItemForm.get('name') as FormControl;
  }

  get size(): FormControl {
    return this.addSubItemForm.get('size') as FormControl;
  }

  get value(): FormControl {
    return this.addSubItemForm.get('quantity.value') as FormControl;
  }

  get quantity(): FormControl {
    return this.addSubItemForm.get('quantity') as FormControl;
  }

  get rate(): FormControl {
    return this.addSubItemForm.get('rate') as FormControl;
  }

  ngOnInit(): void {
    this.saveAndPrintSubItems = new Subject();
    this.addSubItemForm  =  this.formBuilder.group({
      name: ['', Validators.required],
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

  doneAndPrintLabels() {
    if(this.addSubItemForm.valid) {
       const item = {
         item: {
           item_id: this.item.item_id,
           name: this.name.value,
           grade: this.item.grade,
           size: this.size.value
         },
         quantity: this.quantity.value,
         rate: this.rate.value,
         amount: (this.value.value * this.rate.value).toFixed(2)
       } as SubItemInventory;
       this.saveAndPrintSubItems.next(item);
       this.modalRef.hide();
    } else {
      this.addSubItemForm.markAllAsTouched();
    }
  }

}
