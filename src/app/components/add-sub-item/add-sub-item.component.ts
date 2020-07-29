import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { SubItem } from 'src/app/models/sub-item.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-add-sub-item',
  templateUrl: './add-sub-item.component.html',
  styleUrls: ['./add-sub-item.component.scss']
})
export class AddSubItemComponent implements OnInit {

  addSubItemForm: FormGroup;
  subItems: SubItem[];
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveAndPrintSubItems: Subject<SubItem>;

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
      })
    });
  }

  doneAndPrintLabels() {
    if(this.addSubItemForm.valid) {
       const sub_item = {
         ...this.addSubItemForm.value,
         timestamp: new Date().toISOString()
       }
       this.saveAndPrintSubItems.next(sub_item);
       this.modalRef.hide();
    } else {
      this.addSubItemForm.markAllAsTouched();
    }
  }

}
