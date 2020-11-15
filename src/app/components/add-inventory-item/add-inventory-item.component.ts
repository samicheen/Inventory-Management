import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, TypeaheadMatch } from 'ngx-bootstrap';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { InventoryItem } from 'src/app/models/inventory-item.model';
import { ItemService } from 'src/app/services/item/item.service';

@Component({
  selector: 'app-add-inventory-item',
  templateUrl: './add-inventory-item.component.html',
  styleUrls: ['./add-inventory-item.component.scss']
})
export class AddInventoryItemComponent implements OnInit {
  @Input() parentItem?: Item;
  items: Item[];
  selectedItemId: string;
  addInventoryItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveAndPrintInventoryItems: Subject<InventoryItem>;

  constructor(private formBuilder: FormBuilder,
              private itemService: ItemService,
              public modalRef: BsModalRef) { }

  get selectedItem(): FormControl {
    return this.addInventoryItemForm.get('selected_item') as FormControl;
  }

  get value(): FormControl {
    return this.addInventoryItemForm.get('quantity.value') as FormControl;
  }

  get quantity(): FormControl {
    return this.addInventoryItemForm.get('quantity') as FormControl;
  }

  get rate(): FormControl {
    return this.addInventoryItemForm.get('rate') as FormControl;
  }

  get timestamp(): FormControl {
    return this.addInventoryItemForm.get('timestamp') as FormControl;
  }

  ngOnInit(): void {
    this.itemService.getItems().subscribe((response) => {
      this.items = response.items;
    });
    this.saveAndPrintInventoryItems = new Subject();
    this.addInventoryItemForm  =  this.formBuilder.group({
      selected_item: ['', Validators. required],
      quantity: this.formBuilder.group({
        value: ['', Validators.required],
        unit: QuantityUnit.KG
      }),
      rate: ['', Validators.required],
      timestamp: [new Date()],
    });
  }

  doneAndPrintLabels() {
    if(this.addInventoryItemForm.valid) {
       const item = {
         item: {
           parent_item_id: this.parentItem?.item_id,
           item_id: this.selectedItemId
         },
         closing_stock: this.quantity.value,
         rate: this.rate.value,
         closing_amount: (this.value.value * this.rate.value).toFixed(2),
         timestamp: this.timestamp.value
       } as InventoryItem;
       this.saveAndPrintInventoryItems.next(item);
       this.modalRef.hide();
    } else {
      this.addInventoryItemForm.markAllAsTouched();
    }
  }

  onSelect(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.addInventoryItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }
}
