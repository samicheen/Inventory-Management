import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory/inventory.service';
import { PurchaseService } from '../../services/purchase/purchase.service';
import { SalesService } from '../../services/sales/sales.service';
import { SummaryService } from '../../services/summary/summary.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AddPurchaseComponent } from '../add-purchase/add-purchase.component';
import { Purchase } from '../../models/purchase.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalInventory: 0,
    totalInventoryValue: 0,
    totalPurchases: 0,
    totalPurchaseAmount: 0,
    totalSales: 0,
    totalSalesAmount: 0,
    lowStockItems: 0
  };
  
  isLoading = true;
  recentPurchases: any[] = [];
  recentSales: any[] = [];
  lowStockItems: any[] = [];

  constructor(
    private inventoryService: InventoryService,
    private purchaseService: PurchaseService,
    private salesService: SalesService,
    private summaryService: SummaryService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Load inventory stats
    const inventoryParams = new Map();
    inventoryParams.set('retrieve_sub_items', 0);
    this.inventoryService.getInventory(inventoryParams).subscribe({
      next: (response) => {
        if (response.items) {
          this.stats.totalInventory = response.items.length;
          // Sum both main items and sub-items closing amounts for total inventory value
          const mainItemsValue = parseFloat(response.total?.main_items?.closing_amount) || 0;
          const subItemsValue = parseFloat(response.total?.sub_items?.closing_amount) || 0;
          this.stats.totalInventoryValue = mainItemsValue + subItemsValue;
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.checkLoadingComplete();
      }
    });

    // Load purchase stats
    this.purchaseService.getPurchases().subscribe({
      next: (response) => {
        if (response.items) {
          this.stats.totalPurchases = response.items.length;
          this.stats.totalPurchaseAmount = parseFloat(response.total_amount) || 0;
          this.recentPurchases = response.items.slice(0, 5); // Last 5 purchases
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.checkLoadingComplete();
      }
    });

    // Load sales stats
    this.salesService.getSales().subscribe({
      next: (response) => {
        if (response.items) {
          this.stats.totalSales = response.items.length;
          this.stats.totalSalesAmount = parseFloat(response.total_amount) || 0;
          this.recentSales = response.items.slice(0, 5); // Last 5 sales
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.checkLoadingComplete();
      }
    });

    // Load low stock items
    this.inventoryService.getLowStockItems().subscribe({
      next: (response) => {
        if (response && response.items) {
          this.lowStockItems = response.items;
          this.stats.lowStockItems = response.count || 0;
        } else {
          this.lowStockItems = [];
          this.stats.lowStockItems = 0;
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.lowStockItems = [];
        this.stats.lowStockItems = 0;
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete(): void {
    // Simple check - in production, use a counter or RxJS combineLatest
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatQuantity(quantity: any): string {
    if (!quantity) return '0.00 KG';
    // Handle both object format {value, unit} and direct number
    if (typeof quantity === 'object' && quantity.value !== undefined) {
      const value = parseFloat(quantity.value) || 0;
      const unit = quantity.unit || 'KG';
      return `${value.toFixed(2)} ${unit}`;
    } else if (typeof quantity === 'number') {
      return `${quantity.toFixed(2)} KG`;
    }
    return '0.00 KG';
  }

  /**
   * Open purchase modal with item pre-filled for quick reordering
   * This allows users to quickly add a purchase for low stock items
   */
  quickPurchase(item: any): void {
    if (!item || !item.item) return;
    
    // Create purchase object with item pre-filled
    // Vendor and quantity will be filled by user in the modal
    const purchase: Purchase = {
      item: {
        item_id: item.item.item_id,
        name: item.item.name,
        grade: item.item.grade || '',
        size: item.item.size || '',
        is_sub_item: item.item.is_sub_item || false
      }
    } as Purchase;

    const initialState = { purchase };
    const addPurchaseModalRef = this.modalService.show(AddPurchaseComponent, { 
      initialState, 
      backdrop: 'static', 
      keyboard: false 
    });

    if (addPurchaseModalRef.content) {
      addPurchaseModalRef.content.saveAndPrintPurchases.subscribe((purchase: Purchase) => {
        this.purchaseService.addPurchase(purchase).subscribe({
          next: () => {
            // Refresh dashboard data to update low stock items
            this.loadDashboardData();
          },
          error: (error) => {
          }
        });
      });
    }
  }
}
