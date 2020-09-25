import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, TypeaheadMatch } from 'ngx-bootstrap';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { ItemService } from 'src/app/services/item.service';

@Component({
  selector: 'app-sell-item',
  templateUrl: './sell-item.component.html',
  styleUrls: ['./sell-item.component.scss']
})
export class SellItemComponent implements OnInit {
  @Input() item: Item;
  items: Item[];
  selectedItemId: string;
  sellItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  sell: Subject<Item>;

  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef,
              private itemService: ItemService) { }

  get party_name(): FormControl {
    return this.sellItemForm.get('customer.name') as FormControl;
  }

  get selectedItem(): FormControl {
    return this.sellItemForm.get('selected_item') as FormControl;
  }

  get value(): FormControl {
    return this.sellItemForm.get('quantity.value') as FormControl;
  }

  get selling_price(): FormControl {
    return this.sellItemForm.get('selling_price') as FormControl;
  }

  ngOnInit(): void {
    this.itemService.getItems().subscribe((response) => {
      this.items = response.items;
    });
    this.sell = new Subject();
    this.sellItemForm  =  this.formBuilder.group({
      customer: this.formBuilder.group({ 
        name: ['', Validators.required]
      }),
      selected_item: [this.item? this.item.name + ' Grade: ' + this.item.grade + ' Size: ' + this.item.size : '', Validators. required],
      quantity: this.formBuilder.group({
        value: ['', [Validators.required,
                    Validators.pattern(/^[0-9]*$/)]],
        unit: QuantityUnit.KG
      }),
      selling_price:  ['', [Validators.required,
        Validators.pattern(/^\d+\.\d{2}$/)]]
    });
  }

  sellItem() {
    if(this.sellItemForm.valid) {
       const item = {
         item: {
          item_id: this.item ? this.item.item_id: this.selectedItemId
         },
         ...this.sellItemForm.value,
         amount: (this.sellItemForm.value.quantity.value * this.sellItemForm.value.selling_price).toFixed(2)
       }
       this.sell.next(item);
       this.modalRef.hide();
    } else {
      this.sellItemForm.markAllAsTouched();
    }
  }

  onSelect(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.sellItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }

}
