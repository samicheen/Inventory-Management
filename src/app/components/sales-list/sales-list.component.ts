import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RefreshService } from '../../services/refresh/refresh.service';
import { Sale } from 'src/app/models/sale.model';
import { QuantityUnit, QuantityUnitToLabelMapping } from 'src/app/models/quantity.model';
import { SalesService } from 'src/app/services/sales/sales.service';
import { Response } from '../../models/response.model';
import { BsModalService } from 'ngx-bootstrap/modal';
import { SellItemComponent } from '../sell-item/sell-item.component';
import { BehaviorSubject } from 'rxjs';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../services/notification/notification.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit, OnDestroy {
  sales : Sale[];
  total_amount: string;
  quantityUnitToLabelMapping: Record<QuantityUnit, string> = QuantityUnitToLabelMapping
  private readonly refreshItems = new BehaviorSubject(undefined);
  private refreshSubscription: Subscription;

  constructor(
    private salesService: SalesService,
    private modalService: BsModalService,
    private refreshService: RefreshService,
    private notificationService: NotificationService,
    public authService: AuthService
    ) { }

  ngOnInit(): void {
    this.getSales();
    this.refreshItems.subscribe(() => {
      this.getSales();
    });
    
    // Subscribe to refresh service for auto-refresh after barcode scans
    this.refreshSubscription = this.refreshService.refresh$.subscribe((page: string) => {
      if (page === 'sales' || page === 'all') {
        this.getSales();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getSales() {
    this.salesService.getSales()
    .subscribe((response: Response<Sale>) => {
      this.sales = response.items;
      this.total_amount = response.total_amount;
    });
  }

  addSales() {
      let sellItemModalRef = this.modalService.show(SellItemComponent, { backdrop: 'static', keyboard: false });
      sellItemModalRef.content.sell.subscribe(sale => {
        this.salesService.sellItem(sale).subscribe(() => {
          this.refreshItems.next(undefined);
        });
      });
  }

  removeSale(sale: Sale): void {
    const initialState = {
      title: 'Confirm Removal',
      message: `Are you sure you want to remove this sale?\n\nInvoice ID: ${sale.invoice_id}\nItem: ${sale.item.name} Grade: ${sale.item.grade} Size: ${sale.item.size}\nCustomer: ${sale.customer.name}\nQuantity: ${sale.quantity.value} ${this.quantityUnitToLabelMapping[sale.quantity.unit]}\nAmount: Rs. ${sale.amount}\n\n⚠️ WARNING: This will NOT restore inventory automatically. You may need to manually add inventory back if needed.`,
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
        if (confirmed && sale.invoice_id && sale.item?.item_id) {
          this.salesService.removeSale(sale.invoice_id, String(sale.item.item_id)).subscribe({
            next: (response: any) => {
              const message = response.message || 'Sale removed successfully.';
              const warning = response.warning ? ` ${response.warning}` : '';
              this.notificationService.showSuccess(message + warning);
              this.refreshItems.next(undefined);
            },
            error: (error) => {
              const errorMessage = error.error?.message || error.message || 'Error removing sale';
              this.notificationService.showError(errorMessage);
            }
          });
        }
      });
    }
  }

}
