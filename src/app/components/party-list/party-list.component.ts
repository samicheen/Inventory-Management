import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Party } from '../../models/party.model';
import { PartyService } from '../../services/party/party.service';
import { Response } from '../../models/response.model'
import { AddPartyComponent } from '../add-party/add-party.component';
import { NotificationService } from '../../services/notification/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../services/auth/auth.service';
import { GridColumn } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-party-list',
  templateUrl: './party-list.component.html',
  styleUrls: ['./party-list.component.scss']
})
export class PartyListComponent implements OnInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;

  party_type: string;
  button_value: string;
  parties: Party[];
  columns: GridColumn[] = [];
  private readonly refreshItems = new BehaviorSubject(undefined);

  constructor(
    private router: Router,
    private partyService: PartyService,
    private modalService: BsModalService,
    private notificationService: NotificationService,
    public authService: AuthService
    ) { }

  ngOnInit(): void {
    this.initializeColumns();
    this.party_type = this.router.url.split('/').pop();
    this.button_value = this.party_type === 'customer' ? 'Add Customer' : 'Add Vendor';
    this.getParties();
    this.refreshItems.subscribe(() => {
      this.getParties();
    });
  }

  initializeColumns(): void {
    this.columns = [
      { key: 'name', label: 'Name', sortable: true, searchable: true }
    ];
  }

  trackByPartyId(index: number, party: Party): string {
    return party.party_id ? String(party.party_id) : index.toString();
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

  editParty(party: Party) {
    const initialState = {
      type: this.party_type,
      party: party
    };
    let editPartyModalRef = this.modalService.show(AddPartyComponent, { initialState, backdrop: 'static', keyboard: false });
    editPartyModalRef.content.saveParty.subscribe(updatedParty => {
      updatedParty.party_id = party.party_id;
      updatedParty.type = this.party_type;
      this.partyService.updateParty(updatedParty).subscribe(() => {
        this.refreshItems.next(undefined);
      });
    });
  }

  removeParty(party: Party) {
    const partyType = this.party_type === 'customer' ? 'customer' : 'vendor';
    const initialState = {
      title: 'Confirm Removal',
      message: `Are you sure you want to remove this ${partyType}? This action cannot be undone if the ${partyType} is not being used.`,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    };

    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-md'
    });

    if (modalRef.content) {
      modalRef.content.result.subscribe((confirmed: boolean) => {
        if (confirmed) {
          party.type = this.party_type;
          this.partyService.removeParty(party).subscribe(
            () => {
              this.refreshItems.next(undefined);
              this.notificationService.showSuccess(`${partyType.charAt(0).toUpperCase() + partyType.slice(1)} removed successfully`);
            },
            (error) => {
              const errorMessage = error.error?.message || `Unable to delete ${partyType}.`;
              this.notificationService.showError(errorMessage);
            }
          );
        }
      });
    }
  }

}
