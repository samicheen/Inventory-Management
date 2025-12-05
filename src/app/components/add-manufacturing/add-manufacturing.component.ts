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

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get value(): FormControl {
    return this.addManufacturingForm.get('quantity.value') as FormControl;
  }

  ngOnInit(): void {
    this.addToManufacturing = new Subject();
    
    // Use net quantity directly (already calculated from package)
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
      timestamp: [new Date()]
    });
    
    // Auto-update quantity when available_quantity changes (for package barcodes)
    if (this.available_quantity?.value) {
      this.value.setValue(this.available_quantity.value);
    }
  }

  addManufacturing() {
    if(this.addManufacturingForm.valid) {
       const formValue = this.addManufacturingForm.value;
       
       // Quantity is already net (from package barcode or entered directly)
       const manufacture = {
        item: {
          item_id: this.item.item_id
         },
         booked_quantity: {
           value: formValue.quantity.value,
           unit: formValue.quantity.unit
         },
         quantity: {
           value: formValue.quantity.value,
           unit: formValue.quantity.unit
         },
         timestamp: formValue.timestamp
       }
       this.addToManufacturing.next(manufacture);
       this.modalRef.hide();
    } else {
      this.addManufacturingForm.markAllAsTouched();
    }
  }

}
