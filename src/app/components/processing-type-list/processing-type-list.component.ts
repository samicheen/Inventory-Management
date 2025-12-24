import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { ProcessingType, ProcessingTypeService } from '../../services/processing-type/processing-type.service';
import { BehaviorSubject } from 'rxjs';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AddProcessingTypeComponent } from '../add-processing-type/add-processing-type.component';
import { NotificationService } from '../../services/notification/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../services/auth/auth.service';
import { GridColumn } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-processing-type-list',
  templateUrl: './processing-type-list.component.html',
  styleUrls: ['./processing-type-list.component.scss']
})
export class ProcessingTypeListComponent implements OnInit, AfterViewInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;

  processingTypes: ProcessingType[] = [];
  columns: GridColumn[] = [];
  private readonly refreshItems = new BehaviorSubject(undefined);
  
  constructor(
    private processingTypeService: ProcessingTypeService,
    private modalService: BsModalService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getProcessingTypes();
    this.refreshItems.subscribe(() => {
      this.getProcessingTypes();
    });
  }

  ngAfterViewInit(): void {
    this.initializeColumns();
  }

  initializeColumns(): void {
    this.columns = [
      { key: 'name', label: 'Name', sortable: true, searchable: true },
      { 
        key: 'processing_charge', 
        label: 'Processing Charge (Rs./Kg)', 
        sortable: true,
        valueFormatter: (value: number) => value ? parseFloat(String(value)).toFixed(2) : '-'
      },
      { 
        key: 'description', 
        label: 'Description', 
        sortable: false, 
        searchable: true,
        valueFormatter: (value: string) => value || '-'
      }
    ];
  }

  trackByProcessingTypeId(index: number, pt: ProcessingType): number {
    return pt.processing_type_id;
  }

  getProcessingTypes() {
    this.processingTypeService.getProcessingTypes()
    .subscribe((response) => {
      this.processingTypes = response.processing_types;
    }, (error) => {
      this.notificationService.showError('Error loading processing types: ' + (error.error?.message || error.message));
    });
  }

  addProcessingType() {
    let addModalRef = this.modalService.show(AddProcessingTypeComponent, { backdrop: 'static', keyboard: false });
    if (addModalRef.content) {
      addModalRef.content.saveProcessingType.subscribe((processingType: ProcessingType) => {
        this.processingTypeService.addProcessingType(processingType).subscribe(
          () => {
            this.refreshItems.next(undefined);
            this.notificationService.showSuccess('Processing type added successfully');
          },
          (error) => {
            const errorMessage = error.error?.message || 'Unable to add processing type.';
            this.notificationService.showError(errorMessage);
          }
        );
      });
    }
  }

  editProcessingType(processingType: ProcessingType) {
    const initialState = {
      processingType: processingType
    };
    let editModalRef = this.modalService.show(AddProcessingTypeComponent, { initialState, backdrop: 'static', keyboard: false });
    if (editModalRef.content) {
      editModalRef.content.saveProcessingType.subscribe((updatedProcessingType: ProcessingType) => {
        updatedProcessingType.processing_type_id = processingType.processing_type_id;
        this.processingTypeService.updateProcessingType(updatedProcessingType).subscribe(
          () => {
            this.refreshItems.next(undefined);
            this.notificationService.showSuccess('Processing type updated successfully');
          },
          (error) => {
            const errorMessage = error.error?.message || 'Unable to update processing type.';
            this.notificationService.showError(errorMessage);
          }
        );
      });
    }
  }

  removeProcessingType(processingType: ProcessingType) {
    const initialState = {
      title: 'Confirm Removal',
      message: `Are you sure you want to delete "${processingType.name}"? This action cannot be undone.`,
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
        if (confirmed && processingType.processing_type_id) {
          this.processingTypeService.deleteProcessingType(processingType.processing_type_id).subscribe(
            () => {
              this.refreshItems.next(undefined);
              this.notificationService.showSuccess('Processing type removed successfully');
            },
            (error) => {
              const errorMessage = error.error?.message || 'Unable to delete processing type.';
              this.notificationService.showError(errorMessage);
            }
          );
        }
      });
    }
  }
}

