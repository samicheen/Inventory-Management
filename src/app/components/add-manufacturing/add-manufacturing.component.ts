import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { Manufacture } from 'src/app/models/manufacture.model';

@Component({
  selector: 'app-add-manufacuring',
  templateUrl: './add-manufacturing.component.html',
  styleUrls: ['./add-manufacturing.component.scss']
})
export class AddManufacturingComponent implements OnInit {
  @Input() item: Item;
  addManufacturingForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  addToManufacturing: Subject<Manufacture>;

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get value(): FormControl {
    return this.addManufacturingForm.get('quantity.value') as FormControl;
  }

  ngOnInit(): void {
    this.addToManufacturing = new Subject();
    this.addManufacturingForm  =  this.formBuilder.group({
      quantity: this.formBuilder.group({
        value: ['', [Validators.required,
                    Validators.pattern(/^[0-9]*$/)]],
        unit: QuantityUnit.KG
      })
    });
  }

  addManufacturing() {
    if(this.addManufacturingForm.valid) {
       const manufacture = {
        item: {
          item_id: this.item.item_id
         },
         ...this.addManufacturingForm.value
       }
       this.addToManufacturing.next(manufacture);
       this.modalRef.hide();
    } else {
      this.addManufacturingForm.markAllAsTouched();
    }
  }

}
