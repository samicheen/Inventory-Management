import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject } from 'rxjs';
import { SubItem } from 'src/app/models/sub-item.model';

@Component({
  selector: 'app-sell-item',
  templateUrl: './sell-item.component.html',
  styleUrls: ['./sell-item.component.scss']
})
export class SellItemComponent implements OnInit {
  @Input() sub_item: SubItem;
  sellItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  sell: Subject<SubItem>;

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get party_name(): FormControl {
    return this.sellItemForm.get('party_name') as FormControl;
  }

  get value(): FormControl {
    return this.sellItemForm.get('quantity.value') as FormControl;
  }

  get selling_price(): FormControl {
    return this.sellItemForm.get('selling_price') as FormControl;
  }

  ngOnInit(): void {
    this.sell = new Subject();
    this.sellItemForm  =  this.formBuilder.group({
      party_name: ['', Validators.required],
      quantity: this.formBuilder.group({
        value: ['', [Validators.required,
                    Validators.pattern(/^[0-9]*$/)]],
        unit: QuantityUnit.KG
      }),
      selling_price:  ['', [Validators.required,
        Validators.pattern(/^\d+\.\d{2}$/)]]
    });
    console.log(this.sub_item);
  }

  sellItem() {
    if(this.sellItemForm.valid) {
       const item = {
         item_id: this.sub_item.id,
         ...this.sellItemForm.value,
         amount: (this.sellItemForm.value.quantity.value * this.sellItemForm.value.selling_price).toFixed(2),
         timestamp: new Date().toISOString()
       }
       this.sell.next(item);
       this.modalRef.hide();
    } else {
      this.sellItemForm.markAllAsTouched();
    }
  }

}
