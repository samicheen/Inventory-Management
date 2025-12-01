import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-choice-dialog',
  templateUrl: './choice-dialog.component.html',
  styleUrls: ['./choice-dialog.component.scss']
})
export class ChoiceDialogComponent implements OnInit {
  // Properties assigned from initialState by ngx-bootstrap
  title: string = 'Choose Action';
  message: string = '';
  itemName: string = '';
  choice: Subject<boolean>; // true = first choice, false = second choice

  constructor(public modalRef: BsModalRef) { }

  ngOnInit(): void {
    this.choice = new Subject();
  }

  selectFirstChoice(): void {
    this.choice.next(true);
    this.modalRef.hide();
  }

  selectSecondChoice(): void {
    this.choice.next(false);
    this.modalRef.hide();
  }
}

