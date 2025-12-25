import { Component, Input, Output, EventEmitter, TemplateRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';

export interface GridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  cellTemplate?: TemplateRef<any>;
  valueFormatter?: (value: any, row: any) => any;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss']
})
export class DataGridComponent implements OnInit, OnChanges {
  @Input() columns: GridColumn[] = [];
  @Input() data: any[] = [];
  @Input() searchPlaceholder: string = 'Search...';
  @Input() showSearch: boolean = true;
  @Input() showActions: boolean = false;
  @Input() actionsTemplate: TemplateRef<any>;
  @Input() emptyMessage: string = 'No data available';
  @Input() rowClassFn?: (row: any) => string | string[]; // Function to get CSS classes for a row
  @Input() trackByFn: (index: number, item: any) => any;
  @Input() headerActions: boolean = false; // Flag to show header actions slot
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<SortConfig>();

  filteredData: any[] = [];
  searchTerm: string = '';
  sortConfig: SortConfig | null = null;

  ngOnInit(): void {
    if (this.data) {
      this.filteredData = [...this.data];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data || changes.columns) {
      this.applyFilters();
    }
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onSort(column: GridColumn): void {
    if (!column.sortable) return;

    // Toggle sort direction
    if (this.sortConfig?.column === column.key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig = {
        column: column.key,
        direction: 'asc'
      };
    }

    this.applySort();
    this.sortChange.emit(this.sortConfig);
  }

  private applySort(): void {
    if (!this.sortConfig) {
      this.filteredData = [...this.filteredData];
      return;
    }

    this.filteredData.sort((a, b) => {
      let aValue = this.getNestedValue(a, this.sortConfig.column);
      let bValue = this.getNestedValue(b, this.sortConfig.column);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Convert to comparable types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      // Compare values
      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return this.sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }

  private applyFilters(): void {
    if (!this.data) {
      this.filteredData = [];
      return;
    }
    this.filteredData = [...this.data];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredData = this.filteredData.filter(row => {
        return this.columns
          .filter(col => col.searchable !== false)
          .some(col => {
            const value = this.getNestedValue(row, col.key);
            if (value == null) return false;
            const valueStr = String(value).toLowerCase();
            return valueStr.includes(searchLower);
          });
      });
    }

    // Apply sort if configured
    if (this.sortConfig) {
      this.applySort();
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : null;
    }, obj);
  }

  getCellValue(row: any, column: GridColumn): any {
    const value = this.getNestedValue(row, column.key);
    if (column.valueFormatter) {
      return column.valueFormatter(value, row);
    }
    return value;
  }

  getSortIcon(column: GridColumn): string {
    if (!column.sortable || this.sortConfig?.column !== column.key) {
      return 'fa-sort';
    }
    return this.sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onRowClick(row: any): void {
    if (this.rowClick.observers.length > 0) {
      this.rowClick.emit(row);
    }
  }

  trackByIndex(index: number, item: any): any {
    return this.trackByFn ? this.trackByFn(index, item) : index;
  }
}

