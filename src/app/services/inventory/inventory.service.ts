import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryItem } from '../../models/inventory-item.model';
import { Response } from '../../models/response.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddItemResponse } from '../../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  baseUrl: string;
  items: Response<InventoryItem>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get inventory
   */
  getInventory(parent_item_id): Observable<Response<InventoryItem>> {
    const item_id_str = parent_item_id ? `?parent_item_id=${parent_item_id}` : '';
    return this.http.get(`${this.baseUrl}/api/inventory/getInventory.php${item_id_str}`)
    .pipe(map((res: any) => {
      return {
        items: res.inventory,
        total: res.total,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add inventory item
   * @param item Item to add
   */
   addInventoryItem(item: InventoryItem): Observable<AddItemResponse> {
     return this.http.post<AddItemResponse>(`${this.baseUrl}/api/inventory/addInventoryItem.php`, item);
   }
}
