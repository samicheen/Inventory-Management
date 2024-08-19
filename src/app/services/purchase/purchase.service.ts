import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Response } from '../../models/response.model';
import { Observable } from 'rxjs';
import { AddItemResponse } from '../../models/add-item-response.model';
import { Purchase } from '../../models/purchase.model';
import { map } from 'rxjs/operators';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  apiUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get purchases
   */
  getPurchases(): Observable<Response<Purchase>> {
    return this.http.get<Response<Purchase>>(`${this.apiUrl}/api/purchase/getPurchases.php`)
    .pipe(map((res: any) => {
      return {
        items: res.purchases,
        total_amount: res.total_amount,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add purchase
   * @param purchase Purchase to add
   */
  addPurchase(purchase: Purchase): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/purchase/addPurchase.php`, purchase);
  }

  /**
   * Update purchase
   * @param purchase Purchase to update
   */
  updatePurchase(purchase: Purchase) {
    return this.http.post(`${this.apiUrl}/api//updateItem.php`, purchase);
  }

  /**
   * Remove item from inventory
   * @param itemNumber Item to remove
   */
  removeItem(itemNumber) {
    return this.http.delete(`${this.apiUrl}/api/inventory/removeItem.php?itemNumber=${itemNumber}`);
  }
}
