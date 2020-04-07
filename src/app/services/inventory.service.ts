import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Item } from '../models/item.model';
import { InventoryResponse } from '../models/inventory-response.model';
import { Observable } from 'rxjs';
import { AddItemResponse } from '../models/add-item-response.model';
const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  baseUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get inventory
   */
  getInventory(): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${this.baseUrl}/api/inventory/getInventory.php`);
  }

  /**
   * Add item to the inventory
   * @param item Item to add
   */
  addItem(item: Item): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.baseUrl}/api/inventory/addItem.php`, item);
  }

  /**
   * Remove item from inventory
   * @param itemNumber Item to remove
   */
  removeItem(itemNumber) {
    return this.http.delete(`${this.baseUrl}/api/inventory/removeItem.php?itemNumber=${itemNumber}`);
  }
}
