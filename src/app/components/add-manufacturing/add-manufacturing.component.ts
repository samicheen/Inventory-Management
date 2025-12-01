import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
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
  // Properties assigned from initialState by ngx-bootstrap (no @Input() needed)
  item: Item;
  barcode?: string;
  available_quantity?: any;
  rate?: number;
  
  addManufacturingForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  addToManufacturing: Subject<Manufacture>;
  spoolWeight: number = 2.5; // Fixed spool weight in Kg

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get value(): FormControl {
    return this.addManufacturingForm.get('quantity.value') as FormControl;
  }

  get isSpool(): FormControl {
    return this.addManufacturingForm.get('is_spool') as FormControl;
  }

  ngOnInit(): void {
    this.addToManufacturing = new Subject();
    
    // Pre-fill quantity with available quantity if provided
    const initialQuantity = this.available_quantity?.value || '';
    const initialUnit = this.available_quantity?.unit || QuantityUnit.KG;
    
    // Add max validator if available quantity is provided
    const quantityValidators = [Validators.required];
    if (this.available_quantity?.value) {
      quantityValidators.push(Validators.max(this.available_quantity.value));
    }
    
    this.addManufacturingForm = this.formBuilder.group({
      quantity: this.formBuilder.group({
        value: [initialQuantity, quantityValidators],
        unit: [initialUnit]
      }),
      is_spool: [false], // Default to false (coil)
      timestamp: [new Date()]
    });
  }

  getNetWeight(): number {
    if (this.isSpool.value && this.value.value) {
      return Math.max(0, parseFloat(this.value.value) - this.spoolWeight);
    }
    return parseFloat(this.value.value) || 0;
  }

  addManufacturing() {
    if(this.addManufacturingForm.valid) {
       const formValue = this.addManufacturingForm.value;
       
       // If spool is checked, use net weight (entered - spool weight) for the actual quantity
       // The entered value is gross weight (material + spool), but we track net material
       let actualQuantity = formValue.quantity.value;
       if (formValue.is_spool && formValue.quantity.value) {
         actualQuantity = Math.max(0, parseFloat(formValue.quantity.value) - this.spoolWeight);
       }
       
       const manufacture = {
        item: {
          item_id: this.item.item_id
         },
         booked_quantity: {
           value: actualQuantity, // Net weight (same as quantity)
           unit: formValue.quantity.unit
         },
         quantity: {
           value: actualQuantity, // Use net weight if spool, otherwise use entered value
           unit: formValue.quantity.unit
         },
         is_spool: formValue.is_spool,
         timestamp: formValue.timestamp
       }
       this.addToManufacturing.next(manufacture);
       this.modalRef.hide();
    } else {
      this.addManufacturingForm.markAllAsTouched();
    }
  }

}
