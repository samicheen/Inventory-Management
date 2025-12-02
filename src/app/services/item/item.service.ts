import { Injectable, Inject } from '@angular/core';
import { Item } from '../../models/item.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../../models/response.model'
import { AddItemResponse } from '../../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  apiUrl: string;
  items: Response<Item>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get items
   * @param isSubItem Optional: true to get only sub-items, false to get only main items, undefined to get all
   */
  getItems(isSubItem?: boolean): Observable<Response<Item>> {
    let url = `${this.apiUrl}/api/item/getItems.php`;
    if (isSubItem !== undefined) {
      url += `?is_sub_item=${isSubItem ? 1 : 0}`;
    }
    return this.http.get(url)
    .pipe(map((res: any) => {
      return {
        items: res.items,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add item
   * @param item
   */
  addItem(item: Item): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/item/addItem.php`, { item: item });
  }

  /**
   * Update item
   * @param item_id
   * @param item
   */
  updateItem(item_id: string, item: Item): Observable<AddItemResponse> {
    return this.http.put<AddItemResponse>(`${this.apiUrl}/api/item/updateItem.php`, { item_id: item_id, item: item });
  }

  /**
   * Remove item
   * @param item_id
   */
  removeItem(item_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/inventory/removeItem.php?itemNumber=${item_id}`);
  }
}
