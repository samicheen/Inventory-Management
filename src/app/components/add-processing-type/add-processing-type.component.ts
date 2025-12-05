import { Component, OnInit } from '@angular/core';
import { ProcessingType } from '../../services/processing-type/processing-type.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-add-processing-type',
  templateUrl: './add-processing-type.component.html',
  styleUrls: ['./add-processing-type.component.scss']
})
export class AddProcessingTypeComponent implements OnInit {
  addProcessingTypeForm: FormGroup;
  saveProcessingType: Subject<ProcessingType>;
  processingType: ProcessingType; // Assigned from initialState by ngx-bootstrap
  isEditMode: boolean = false;
  
  constructor(
    private formBuilder: FormBuilder,
    public modalRef: BsModalRef
  ) { }

  get name(): FormControl {
    return this.addProcessingTypeForm.get('name') as FormControl;
  }

  get processingCharge(): FormControl {
    return this.addProcessingTypeForm.get('processing_charge') as FormControl;
  }

  get description(): FormControl {
    return this.addProcessingTypeForm.get('description') as FormControl;
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.isEditMode = !!this.processingType;
    
    this.saveProcessingType = new Subject();
    this.addProcessingTypeForm = this.formBuilder.group({
      name: [this.processingType?.name || '', Validators.required],
      processing_charge: [this.processingType?.processing_charge || 0, [Validators.required, Validators.min(0)]],
      description: [this.processingType?.description || ''],
      is_active: [this.processingType?.is_active !== undefined ? this.processingType.is_active : true]
    });
  }

  addProcessingType() {
    if (this.addProcessingTypeForm.valid) {
      this.saveProcessingType.next(this.addProcessingTypeForm.value);
      this.modalRef.hide();
    } else {
      this.addProcessingTypeForm.markAllAsTouched();
    }
  }
}

