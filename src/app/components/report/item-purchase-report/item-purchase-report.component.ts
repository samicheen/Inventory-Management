import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { GridColumn } from '../../data-grid/data-grid.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-item-purchase-report',
  templateUrl: './item-purchase-report.component.html',
  styleUrls: ['./item-purchase-report.component.scss']
})
export class ItemPurchaseReportComponent implements OnInit, AfterViewInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;

  items: any[] = [];
  summary: any = {};
  isLoading = false;
  columns: GridColumn[] = [];
  startDate: string = '';
  endDate: string = '';

  constructor(
    private reportsService: ReportsService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadReport();
  }

  ngAfterViewInit(): void {
    this.initializeColumns();
  }

  initializeColumns(): void {
    this.columns = [
      { 
        key: 'item_name', 
        label: 'Item Name', 
        sortable: true,
        valueFormatter: (val, row) => {
          let name = row.item_name || '';
          if (row.size) name += ` Size: ${row.size}`;
          if (row.grade) name += ` Grade: ${row.grade}`;
          return name;
        }
      },
      { 
        key: 'is_sub_item', 
        label: 'Type', 
        sortable: true,
        valueFormatter: (val) => val ? 'Sub Item' : 'Main Item'
      },
      { key: 'total_invoices', label: 'Total Invoices', sortable: true, valueFormatter: (val) => val || 0 },
      { key: 'total_vendors', label: 'Total Vendors', sortable: true, valueFormatter: (val) => val || 0 },
      { 
        key: 'total_quantity', 
        label: 'Total Quantity', 
        sortable: true,
        valueFormatter: (val) => {
          if (val && val.value !== undefined) {
            return `${parseFloat(val.value).toFixed(2)} ${val.unit || 'KG'}`;
          }
          return '0.00 KG';
        }
      },
      { 
        key: 'total_amount', 
        label: 'Total Cost', 
        sortable: true,
        valueFormatter: (val) => this.formatCurrency(val || 0)
      },
      { 
        key: 'average_rate', 
        label: 'Avg. Rate', 
        sortable: true,
        valueFormatter: (val) => this.formatCurrency(val || 0)
      },
      { 
        key: 'first_purchase_date', 
        label: 'First Purchase', 
        sortable: true,
        valueFormatter: (val) => val ? this.formatDate(val) : '-'
      },
      { 
        key: 'last_purchase_date', 
        label: 'Last Purchase', 
        sortable: true,
        valueFormatter: (val) => val ? this.formatDate(val) : '-'
      }
    ];
  }

  loadReport(): void {
    this.isLoading = true;
    const startDate = this.startDate || undefined;
    const endDate = this.endDate || undefined;

    this.reportsService.getItemWisePurchases(startDate, endDate).subscribe({
      next: (response) => {
        this.items = response.items || [];
        this.summary = response.summary || {};
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.showError('Error loading report: ' + (error.error?.message || error.message));
        this.isLoading = false;
      }
    });
  }

  onDateFilterChange(): void {
    this.loadReport();
  }

  exportToExcel(): void {
    if (this.items.length === 0) {
      this.notificationService.showError('No data to export');
      return;
    }

    const data = this.items.map(item => ({
      'Item Name': item.item_name,
      'Type': item.is_sub_item ? 'Sub Item' : 'Main Item',
      'Total Invoices': item.total_invoices,
      'Total Vendors': item.total_vendors,
      'Total Quantity': `${parseFloat(item.total_quantity.value || 0).toFixed(2)} ${item.total_quantity.unit || 'KG'}`,
      'Total Cost': parseFloat(item.total_amount || 0).toFixed(2),
      'Avg. Rate': parseFloat(item.average_rate || 0).toFixed(2),
      'First Purchase Date': item.first_purchase_date ? this.formatDate(item.first_purchase_date) : '-',
      'Last Purchase Date': item.last_purchase_date ? this.formatDate(item.last_purchase_date) : '-'
    }));

    // Add summary row
    const totalInvoices = this.items.reduce((sum, item) => sum + (item.total_invoices || 0), 0);
    data.push({
      'Item Name': 'TOTAL',
      'Type': '-',
      'Total Invoices': totalInvoices,
      'Total Vendors': '-',
      'Total Quantity': `${parseFloat(this.summary.total_quantity || 0).toFixed(2)} KG`,
      'Total Cost': parseFloat(this.summary.total_amount || 0).toFixed(2),
      'Avg. Rate': '-',
      'First Purchase Date': '-',
      'Last Purchase Date': '-'
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Item Purchase Report');

    const fileName = `Item_Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    this.notificationService.showSuccess('Report exported successfully');
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

  trackByItemId(index: number, item: any): string {
    return item.item_id ? String(item.item_id) : index.toString();
  }
}
