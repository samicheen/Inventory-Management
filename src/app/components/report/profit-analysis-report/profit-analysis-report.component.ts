import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { ReportsService } from '../../../services/reports/reports.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { GridColumn } from '../../data-grid/data-grid.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-profit-analysis-report',
  templateUrl: './profit-analysis-report.component.html',
  styleUrls: ['./profit-analysis-report.component.scss']
})
export class ProfitAnalysisReportComponent implements OnInit, AfterViewInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;
  @ViewChild('profitTemplate') profitTemplate: TemplateRef<any>;
  @ViewChild('marginTemplate') marginTemplate: TemplateRef<any>;

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
    // Wait for templates to be available
    setTimeout(() => {
      this.initializeColumns();
    }, 0);
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
      { 
        key: 'sales.quantity', 
        label: 'Sales Qty', 
        sortable: true,
        valueFormatter: (val, row) => {
          if (row.sales && row.sales.quantity && row.sales.quantity.value !== undefined) {
            return `${parseFloat(row.sales.quantity.value).toFixed(2)} ${row.sales.quantity.unit || 'KG'}`;
          }
          return '0.00 KG';
        }
      },
      { 
        key: 'sales.average_price', 
        label: 'Selling Price', 
        sortable: true,
        valueFormatter: (val, row) => this.formatCurrency(row.sales?.average_price || 0) + '/KG'
      },
      { 
        key: 'sales.amount', 
        label: 'Sales Revenue', 
        sortable: true,
        valueFormatter: (val, row) => this.formatCurrency(row.sales?.amount || 0)
      },
      { 
        key: 'purchases.average_rate', 
        label: 'Purchase Rate', 
        sortable: true,
        valueFormatter: (val, row) => {
          const rate = row.purchases?.average_rate || 0;
          return rate > 0 ? this.formatCurrency(rate) + '/KG' : '-';
        }
      },
      { 
        key: 'purchases.cogs', 
        label: 'COGS', 
        sortable: true,
        valueFormatter: (val, row) => this.formatCurrency(row.purchases?.cogs || 0)
      },
      { 
        key: 'profit.amount', 
        label: 'Gross Profit', 
        sortable: true,
        cellTemplate: this.profitTemplate,
        valueFormatter: (val, row) => row.profit?.amount || 0
      },
      { 
        key: 'profit.margin_percentage', 
        label: 'Gross Margin %', 
        sortable: true,
        cellTemplate: this.marginTemplate,
        valueFormatter: (val, row) => row.profit?.margin_percentage || 0
      }
    ];
  }

  loadReport(): void {
    this.isLoading = true;
    const startDate = this.startDate || undefined;
    const endDate = this.endDate || undefined;

    this.reportsService.getProfitAnalysis(startDate, endDate).subscribe({
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
      'Sales Quantity': item.sales?.quantity ? `${parseFloat(item.sales.quantity.value || 0).toFixed(2)} ${item.sales.quantity.unit || 'KG'}` : '0.00 KG',
      'Selling Price': item.sales?.average_price ? `${parseFloat(item.sales.average_price || 0).toFixed(2)}/KG` : '-',
      'Sales Revenue': parseFloat(item.sales?.amount || 0).toFixed(2),
      'Purchase Rate': item.purchases?.average_rate ? `${parseFloat(item.purchases.average_rate || 0).toFixed(2)}/KG` : '-',
      'COGS': parseFloat(item.purchases?.cogs || 0).toFixed(2),
      'Gross Profit': parseFloat(item.profit?.amount || 0).toFixed(2),
      'Gross Margin %': parseFloat(item.profit?.margin_percentage || 0).toFixed(2)
    }));

    // Add summary row
    data.push({
      'Item Name': 'TOTAL',
      'Type': '-',
      'Sales Quantity': '-',
      'Selling Price': '-',
      'Sales Revenue': parseFloat(this.summary.total_sales || 0).toFixed(2),
      'Purchase Rate': '-',
      'COGS': parseFloat(this.summary.total_cogs || 0).toFixed(2),
      'Gross Profit': parseFloat(this.summary.total_profit || 0).toFixed(2),
      'Gross Margin %': parseFloat(this.summary.overall_margin_percentage || 0).toFixed(2)
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profit Analysis Report');

    const fileName = `Profit_Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  getProfitClass(profit: number): string {
    return profit >= 0 ? 'text-success' : 'text-danger';
  }
}
