import { Component, OnInit } from '@angular/core';
import { Item } from '../../models/item.model';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent implements OnInit {
  addItemForm: FormGroup;
  saveItem: Subject<Item>;
  item: Item; // Assigned from initialState by ngx-bootstrap
  isEditMode: boolean = false;
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get name(): FormControl {
    return this.addItemForm.get('name') as FormControl;
  }

  get size(): FormControl {
    return this.addItemForm.get('size') as FormControl;
  }

  get grade(): FormControl {
    return this.addItemForm.get('grade') as FormControl;
  }

  get isSubItem(): FormControl {
    return this.addItemForm.get('is_sub_item') as FormControl;
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.isEditMode = !!this.item;
    
    this.saveItem = new Subject();
    this.addItemForm  =  this.formBuilder.group({
        name: [this.item?.name || '', Validators.required],
        size: [this.item?.size || '', Validators.required],
        grade: [this.item?.grade || '', Validators.required],
        is_sub_item: [this.item?.is_sub_item || false]
    });
  }

  addItem() {
    if(this.addItemForm.valid) {
      this.saveItem.next(this.addItemForm.value);
      this.modalRef.hide();
    } else {
      this.addItemForm.markAllAsTouched();
    }
  }
}
