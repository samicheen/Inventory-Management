import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  apiUrl: string;
  items: Response<InventoryItem>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get inventory
   */
  getInventory(inventoryParameters: Map<string, any>): Observable<Response<InventoryItem>> {
    let params = new HttpParams();
    inventoryParameters.forEach((value: any, key: string) => {
      params = value ? params.append(key, value): params;
    });
    return this.http.get(`${this.apiUrl}/api/inventory/getInventory.php`, { params: params })
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
     return this.http.post<AddItemResponse>(`${this.apiUrl}/api/inventory/addInventoryItem.php`, item);
   }
}
