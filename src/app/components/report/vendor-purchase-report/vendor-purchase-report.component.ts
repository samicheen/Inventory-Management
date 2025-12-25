import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { GridColumn } from '../../data-grid/data-grid.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-vendor-purchase-report',
  templateUrl: './vendor-purchase-report.component.html',
  styleUrls: ['./vendor-purchase-report.component.scss']
})
export class VendorPurchaseReportComponent implements OnInit, AfterViewInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;

  vendors: any[] = [];
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
      { key: 'vendor_name', label: 'Vendor Name', sortable: true },
      { key: 'total_invoices', label: 'Total Invoices', sortable: true, valueFormatter: (val) => val || 0 },
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
        label: 'Total Amount', 
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

    this.reportsService.getVendorWisePurchases(startDate, endDate).subscribe({
      next: (response) => {
        this.vendors = response.vendors || [];
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
    if (this.vendors.length === 0) {
      this.notificationService.showError('No data to export');
      return;
    }

    const data = this.vendors.map(vendor => ({
      'Vendor Name': vendor.vendor_name,
      'Total Invoices': vendor.total_invoices,
      'Total Quantity': `${parseFloat(vendor.total_quantity.value || 0).toFixed(2)} ${vendor.total_quantity.unit || 'KG'}`,
      'Total Amount': parseFloat(vendor.total_amount || 0).toFixed(2),
      'First Purchase Date': vendor.first_purchase_date ? this.formatDate(vendor.first_purchase_date) : '-',
      'Last Purchase Date': vendor.last_purchase_date ? this.formatDate(vendor.last_purchase_date) : '-'
    }));

    // Calculate sum of invoices
    const totalInvoices = this.vendors.reduce((sum, vendor) => sum + (vendor.total_invoices || 0), 0);

    // Add summary row
    data.push({
      'Vendor Name': 'TOTAL',
      'Total Invoices': totalInvoices,
      'Total Quantity': `${parseFloat(this.summary.total_quantity || 0).toFixed(2)} KG`,
      'Total Amount': parseFloat(this.summary.total_amount || 0).toFixed(2),
      'First Purchase Date': '-',
      'Last Purchase Date': '-'
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Purchase Report');

    const fileName = `Vendor_Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  trackByVendorId(index: number, vendor: any): string {
    return vendor.vendor_id ? String(vendor.vendor_id) : index.toString();
  }
}
