import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-add-package-modal',
  templateUrl: './add-package-modal.component.html',
  styleUrls: ['./add-package-modal.component.scss']
})
export class AddPackageModalComponent implements OnInit {

  constructor(public modalRef: BsModalRef) { }

  ngOnInit(): void {
  }

}
