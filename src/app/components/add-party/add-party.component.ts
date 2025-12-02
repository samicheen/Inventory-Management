import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { Party } from 'src/app/models/party.model';

@Component({
  selector: 'app-add-party',
  templateUrl: './add-party.component.html',
  styleUrls: ['./add-party.component.scss']
})
export class AddPartyComponent implements OnInit {
  type: string; // Assigned from initialState by ngx-bootstrap
  party: Party; // Assigned from initialState by ngx-bootstrap
  title: string;
  addPartyForm: FormGroup;
  saveParty: Subject<Party>;
  isEditMode: boolean = false;
  constructor(private formBuilder: FormBuilder,
              public modalRef: BsModalRef) { }

  get name(): FormControl {
    return this.addPartyForm.get('name') as FormControl;
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.isEditMode = !!this.party;
    
    this.title = this.isEditMode 
      ? (this.type === 'customer' ? 'Edit Customer' : 'Edit Vendor')
      : (this.type === 'customer' ? 'Add Customer' : 'Add Vendor');
    this.saveParty = new Subject();
    this.addPartyForm  =  this.formBuilder.group({
      name: [this.party?.name || '', Validators.required]
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
