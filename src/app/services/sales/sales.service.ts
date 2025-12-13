import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale } from '../../models/sale.model';
import { Response } from '../../models/response.model';
import { map } from 'rxjs/operators';
import { AddItemResponse } from '../../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  apiUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get Sales
   */
  getSales(): Observable<Response<Sale>> {
    return this.http.get<Response<Sale>>(`${this.apiUrl}/api/sales/getSales.php`)
    .pipe(map((res: any) => {
      return {
        items: res.sales,
        total_amount: res.total_amount,
        alerts: res.alerts
      };
    }));
  }

  sellItem(sale: Sale): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/sales/sellItem.php`, sale);
  }

  /**
   * Sell multiple items in a single transaction
   * @param invoiceId Common invoice ID for all sales
   * @param customer Customer object with name
   * @param sales Array of sale objects
   */
  sellItems(invoiceId: string, customer: { name: string }, sales: Sale[]): Observable<any> {
    const payload = {
      invoice_id: invoiceId,
      customer: customer,
      sales: sales
    };
    return this.http.post<any>(`${this.apiUrl}/api/sales/sellItems.php`, payload);
  }

  /**
   * Remove sale
   * @param invoiceId 
   * @param itemId Optional - if provided, removes only that item from invoice
   */
  removeSale(invoiceId: string, itemId?: string): Observable<any> {
    let url = `${this.apiUrl}/api/sales/removeSale.php?invoice_id=${invoiceId}`;
    if (itemId) {
      url += `&item_id=${itemId}`;
    }
    return this.http.delete<any>(url);
  }
}
