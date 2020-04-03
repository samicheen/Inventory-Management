import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from  '@angular/forms';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent implements OnInit {
  addItem: FormGroup;
  items

  constructor(private formBuilder: FormBuilder) { }

  get item() {
    return this.addItem.controls;
  }

  ngOnInit(): void {
    this.addItem  =  this.formBuilder.group({
      invoiceNo: ['', Validators.required],
      vendor: ['', Validators.required],
      itemName: ['', Validators.required],
      grade: ['', Validators.required],
      size: ['', Validators.required,
                 Validators.pattern(/^\d+\.\d{1}$/)],
      quantity: ['', Validators.required,
                     Validators.pattern(/^[0-9]*$/)],
      rate: ['', Validators.required,
                 Validators.pattern(/^\d+\.\d{2}$/)]
    });
  }

  nextItem() {

  }

  applyToNext() {

  }

  doneAndPrintLabels() {

  }
}
