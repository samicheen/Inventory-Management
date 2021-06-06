import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Party } from '../../models/party.model';
import { PartyService } from '../../services/party/party.service';
import { Response } from '../../models/response.model'
import { AddPartyComponent } from '../add-party/add-party.component';

@Component({
  selector: 'app-party-list',
  templateUrl: './party-list.component.html',
  styleUrls: ['./party-list.component.scss']
})
export class PartyListComponent implements OnInit {

  party_type: string;
  button_value: string;
  parties: Party[];
  private readonly refreshItems = new BehaviorSubject(undefined);

  constructor(
    private router: Router,
    private partyService: PartyService,
    private modalService: BsModalService
    ) { }

  ngOnInit(): void {
    this.party_type = this.router.url.split('/').pop();
    this.button_value = this.party_type === 'customer' ? 'Add Customer' : 'Add Vendor';
    this.getParties();
    this.refreshItems.subscribe(() => {
      this.getParties();
    });
  }

  getParties() {
    this.partyService.getParties(this.party_type)
    .subscribe((response: Response<Party>) => {
      this.parties = response.items;
    });
  }

  addParty() {
    const initialState = {
      type: this.party_type
    };
    let addPartyModalRef = this.modalService.show(AddPartyComponent, { initialState, backdrop: 'static', keyboard: false });
    addPartyModalRef.content.saveParty.subscribe(party => {
      this.partyService.addParty(party).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

}
