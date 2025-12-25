import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { GridColumn } from '../../data-grid/data-grid.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-customer-sales-report',
  templateUrl: './customer-sales-report.component.html',
  styleUrls: ['./customer-sales-report.component.scss']
})
export class CustomerSalesReportComponent implements OnInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;

  customers: any[] = [];
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
    this.initializeColumns();
    this.loadReport();
  }

  initializeColumns(): void {
    this.columns = [
      { key: 'customer_name', label: 'Customer Name', sortable: true },
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
        key: 'first_sale_date', 
        label: 'First Sale', 
        sortable: true,
        valueFormatter: (val) => val ? this.formatDate(val) : '-'
      },
      { 
        key: 'last_sale_date', 
        label: 'Last Sale', 
        sortable: true,
        valueFormatter: (val) => val ? this.formatDate(val) : '-'
      }
    ];
  }

  loadReport(): void {
    this.isLoading = true;
    const startDate = this.startDate || undefined;
    const endDate = this.endDate || undefined;

    this.reportsService.getCustomerWiseSales(startDate, endDate).subscribe({
      next: (response) => {
        this.customers = response.customers || [];
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
    if (this.customers.length === 0) {
      this.notificationService.showError('No data to export');
      return;
    }

    const data = this.customers.map(customer => ({
      'Customer Name': customer.customer_name,
      'Total Invoices': customer.total_invoices,
      'Total Quantity': `${parseFloat(customer.total_quantity.value || 0).toFixed(2)} ${customer.total_quantity.unit || 'KG'}`,
      'Total Amount': parseFloat(customer.total_amount || 0).toFixed(2),
      'First Sale Date': customer.first_sale_date ? this.formatDate(customer.first_sale_date) : '-',
      'Last Sale Date': customer.last_sale_date ? this.formatDate(customer.last_sale_date) : '-'
    }));

    // Calculate sum of invoices
    const totalInvoices = this.customers.reduce((sum, customer) => sum + (customer.total_invoices || 0), 0);

    // Add summary row
    data.push({
      'Customer Name': 'TOTAL',
      'Total Invoices': totalInvoices,
      'Total Quantity': `${parseFloat(this.summary.total_quantity || 0).toFixed(2)} KG`,
      'Total Amount': parseFloat(this.summary.total_amount || 0).toFixed(2),
      'First Sale Date': '-',
      'Last Sale Date': '-'
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Sales Report');

    const fileName = `Customer_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  trackByCustomerId(index: number, customer: any): string {
    return customer.customer_id ? String(customer.customer_id) : index.toString();
  }
}
