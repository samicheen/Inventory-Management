import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs';
import { Party } from 'src/app/models/party.model';

@Component({
  selector: 'app-add-party',
  templateUrl: './add-party.component.html',
  styleUrls: ['./add-party.component.scss']
})
export class AddPartyComponent implements OnInit {
  @Input() type: string;
  title: string;
  addPartyForm: FormGroup;
  saveParty: Subject<Party>;
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get name(): FormControl {
    return this.addPartyForm.get('name') as FormControl;
  }

  ngOnInit(): void {
    this.title = this.type === 'customer' ? 'Add Customer' : 'Add Vendor';
    this.saveParty = new Subject();
    this.addPartyForm  =  this.formBuilder.group({
      name: ['', Validators.required]
    });
  }

  addParty() {
    if(this.addPartyForm.valid) {
      const party = {
        type: this.type,
        name: this.name.value
      } as Party;
      this.saveParty.next(party);
      this.modalRef.hide();
    } else {
      this.addPartyForm.markAllAsTouched();
    }
  }
}
