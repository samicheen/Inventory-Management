import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit {

  reports = [
    {
      id: 'profit-analysis',
      title: 'Profit Analysis Report',
      description: 'Sales vs Purchase comparison with profit margins and profitability analysis',
      icon: 'fa-line-chart',
      route: '/reports/profit-analysis'
    },
    {
      id: 'item-sales',
      title: 'Item-wise Sales Report',
      description: 'View sales summary grouped by item with revenue insights and top sellers',
      icon: 'fa-bar-chart',
      route: '/reports/item-sales'
    },
    {
      id: 'item-purchase',
      title: 'Item-wise Purchase Report',
      description: 'View purchase summary grouped by item with cost insights',
      icon: 'fa-shopping-cart',
      route: '/reports/item-purchase'
    },
    {
      id: 'customer-sales',
      title: 'Customer-wise Sales Report',
      description: 'View sales summary grouped by customer with total quantity and amount',
      icon: 'fa-users',
      route: '/reports/customer-sales'
    },
    {
      id: 'vendor-purchase',
      title: 'Vendor-wise Purchase Report',
      description: 'View purchase summary grouped by vendor with total quantity and amount',
      icon: 'fa-truck',
      route: '/reports/vendor-purchase'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navigateToReport(route: string): void {
    this.router.navigate([route]);
  }
}
