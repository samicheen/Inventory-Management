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

  /**
   * Get inventory by barcode (for barcode scanning)
   * @param barcode Barcode to lookup
   */
  getInventoryByBarcode(barcode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/inventory/getInventoryByBarcode.php?barcode=${encodeURIComponent(barcode)}`);
  }

  /**
   * Get weighted average inventory rate by item_id
   * This ensures correct rate calculation when multiple purchases exist for the same item
   */
  getInventoryRateByItemId(itemId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/inventory/getInventoryRateByItemId.php?item_id=${encodeURIComponent(itemId)}`);
  }

  /**
   * Get packages for an inventory item (for sub-items/processed items)
   * @param itemId Item ID to get packages for
   */
  getInventoryPackages(itemId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/inventory/getInventoryPackages.php?item_id=${itemId}`);
  }

  /**
   * Remove inventory item (only if not in use downstream)
   * @param inventoryId Inventory ID (optional)
   * @param barcode Barcode (optional, used if inventory_id is not available)
   * @param itemId Item ID (optional, helps identify sub-items more accurately)
   */
   removeInventory(inventoryId?: string, barcode?: string, itemId?: string): Observable<any> {
     const params: string[] = [];
     
     if (inventoryId && inventoryId.trim() !== '') {
       params.push(`inventory_id=${encodeURIComponent(inventoryId.trim())}`);
     }
     
     if (barcode && barcode.trim() !== '') {
       params.push(`barcode=${encodeURIComponent(barcode.trim())}`);
     }
     
     if (itemId && itemId.trim() !== '') {
       params.push(`item_id=${encodeURIComponent(itemId.trim())}`);
     }
     
     if (params.length === 0) {
       return new Observable(observer => {
         observer.error({ error: { message: 'Either inventory_id, barcode, or item_id must be provided' } });
       });
     }
     
     const queryString = params.join('&');
     return this.http.delete(`${this.apiUrl}/api/inventory/removeInventory.php?${queryString}`, {
       responseType: 'json'
     });
   }

   /**
    * Unpackage multiple packages and add to manufacturing for further processing
    */
   unpackageAndProcessFurther(data: {packages: any[], processing_type_id: number}): Observable<any> {
     return this.http.post(`${this.apiUrl}/api/inventory/unpackageAndProcessFurther.php`, data, {
       responseType: 'json'
     });
   }
}
