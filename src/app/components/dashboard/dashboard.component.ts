import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory/inventory.service';
import { PurchaseService } from '../../services/purchase/purchase.service';
import { SalesService } from '../../services/sales/sales.service';
import { SummaryService } from '../../services/summary/summary.service';

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

  constructor(
    private inventoryService: InventoryService,
    private purchaseService: PurchaseService,
    private salesService: SalesService,
    private summaryService: SummaryService
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
          this.stats.totalInventoryValue = parseFloat(response.total?.closing_amount) || 0;
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
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
        console.error('Error loading purchases:', error);
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
        console.error('Error loading sales:', error);
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
}
