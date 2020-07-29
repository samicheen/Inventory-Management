import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inventory } from '../models/inventory.model';
import { Response } from '../models/response.model';
import { Observable } from 'rxjs';
import { AddItemResponse } from '../models/add-item-response.model';
import { Purchase } from '../models/purchase.model';
import { map } from 'rxjs/operators';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  baseUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get purchases
   */
  getPurchases(): Observable<Response<Purchase>> {
    return this.http.get<Response<Purchase>>(`${this.baseUrl}/api/purchase/getPurchases.php`)
    .pipe(map((res: any) => {
      return {
        items: res.purchases,
        total_amount: res.total_amount,
        alerts: res.alerts
      };
    }));;
  }

  /**
   * Add purchase
   * @param purchase Purchase to add
   */
  addPurchase(purchase: Purchase): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.baseUrl}/api/purchase/addPurchase.php`, purchase);
  }

  /**
   * Update item in the inventory
   * @param item Item to update
   */
  // updateItem(item: Item) {
  //   return this.http.post(`${this.baseUrl}/api/inventory/updateItem.php`, item);
  // }

  /**
   * Remove item from inventory
   * @param itemNumber Item to remove
   */
  removeItem(itemNumber) {
    return this.http.delete(`${this.baseUrl}/api/inventory/removeItem.php?itemNumber=${itemNumber}`);
  }
}
