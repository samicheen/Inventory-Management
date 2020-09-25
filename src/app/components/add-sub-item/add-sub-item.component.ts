import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, TypeaheadMatch } from 'ngx-bootstrap';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { Subject } from 'rxjs';
import { Item } from 'src/app/models/item.model';
import { SubItemInventory } from 'src/app/models/sub-item-inventory.model';
import { ItemService } from 'src/app/services/item.service';

@Component({
  selector: 'app-add-sub-item',
  templateUrl: './add-sub-item.component.html',
  styleUrls: ['./add-sub-item.component.scss']
})
export class AddSubItemComponent implements OnInit {
  @Input() parentItem?: Item;
  items: Item[];
  selectedItemId: string;
  addSubItemForm: FormGroup;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping;
  unitValues = Object.values(QuantityUnit);
  saveAndPrintSubItems: Subject<SubItemInventory>;

  constructor(private formBuilder: FormBuilder,
              private itemService: ItemService,
              public modalRef: BsModalRef) { }

  get selectedItem(): FormControl {
    return this.addSubItemForm.get('selected_item') as FormControl;
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

  get timestamp(): FormControl {
    return this.addSubItemForm.get('timestamp') as FormControl;
  }

  ngOnInit(): void {
    this.itemService.getItems().subscribe((response) => {
      this.items = response.items;
    });
    this.saveAndPrintSubItems = new Subject();
    this.addSubItemForm  =  this.formBuilder.group({
      selected_item: ['', Validators. required],
      quantity: this.formBuilder.group({
        value: ['', [Validators.required,
                    Validators.pattern(/^[0-9]*$/)]],
        unit: QuantityUnit.KG
      }),
      rate: ['', [Validators.required,
        Validators.pattern(/^\d+\.\d{2}$/)]],
      timestamp: [new Date()],
    });
  }

  doneAndPrintLabels() {
    if(this.addSubItemForm.valid) {
       const item = {
         item: {
           parent_item_id: this.parentItem?.item_id,
           item_id: this.selectedItemId
         },
         quantity: this.quantity.value,
         rate: this.rate.value,
         amount: (this.value.value * this.rate.value).toFixed(2),
         timestamp: this.timestamp.value
       } as SubItemInventory;
       this.saveAndPrintSubItems.next(item);
       this.modalRef.hide();
    } else {
      this.addSubItemForm.markAllAsTouched();
    }
  }

  onSelect(event: TypeaheadMatch): void {
    const item = event.item;
    this.selectedItemId = item.item_id;
    this.addSubItemForm.patchValue({
      selected_item: item.name + ' Grade: ' + item.grade + ' Size: ' + item.size
    })
  }
}
