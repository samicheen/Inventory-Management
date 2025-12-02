import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
  // Properties assigned from initialState by ngx-bootstrap
  title: string = 'Confirm';
  message: string = '';
  confirmText: string = 'OK';
  cancelText: string = 'Cancel';
  result: Subject<boolean>; // true = confirmed, false = cancelled

  constructor(public modalRef: BsModalRef) { }

  ngOnInit(): void {
    this.result = new Subject();
  }

  confirm(): void {
    this.result.next(true);
    this.modalRef.hide();
  }

  cancel(): void {
    this.result.next(false);
    this.modalRef.hide();
  }
}

