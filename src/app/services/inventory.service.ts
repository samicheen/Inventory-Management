import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inventory } from '../models/inventory.model';
import { Response } from '../models/response.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  baseUrl: string;
  items: Response<Inventory>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get inventory
   */
  getInventory(item_id): Observable<Response<Inventory>> {
    const item_id_str = item_id ? `?item_id=${item_id}` : '';
    return this.http.get(`${this.baseUrl}/api/inventory/getInventory.php${item_id_str}`)
    .pipe(map((res: any) => {
      return {
        items: res.inventory,
        total_amount: res.total_amount,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add item to the inventory
   * @param item Item to add
   */
  // addItem(item: Item): Observable<AddItemResponse> {
  //   return this.http.post<AddItemResponse>(`${this.baseUrl}/api/inventory/addItem.php`, item);
  // }

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
