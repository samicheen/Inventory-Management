import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inventory } from '../models/inventory.model';
import { Response } from '../models/response.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubItemInventory } from '../models/sub-item-inventory.model';
import { AddItemResponse } from '../models/add-item-response.model';

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
  getInventory(parent_item_id): Observable<Response<Inventory>> {
    const item_id_str = parent_item_id ? `?parent_item_id=${parent_item_id}` : '';
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
   * Add sub item inventory
   * @param item Item to add
   */
   addSubItemInventory(item: SubItemInventory): Observable<AddItemResponse> {
     return this.http.post<AddItemResponse>(`${this.baseUrl}/api/inventory/addSubItemInventory.php`, item);
   }
}
