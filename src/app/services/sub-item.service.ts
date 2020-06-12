import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubItemResponse } from '../models/sub-item-response.model';
import { SubItem } from '../models/sub-item.model';
import { AddItemResponse } from '../models/add-item-response.model';
import { SellItem } from '../models/sell-item.model';
const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class SubItemService {
  baseUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get sub items
   */
  getSubItems(item_id: string): Observable<SubItemResponse> {
    return this.http.get<SubItemResponse>(`${this.baseUrl}/api/sub_item/getSubItem.php?item_id=${item_id}`);
  }

  /**
   * Add sub item
   * @param subItem Sub item to add
   */
  addSubItem(sub_item: SubItem): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.baseUrl}/api/sub_item/addSubItem.php`, sub_item);
  }

  /**
   * Remove sub item
   * @param id Sub item to remove
   */
  removeItem(id: string) {
    return this.http.delete(`${this.baseUrl}/api/sub_item/removeSubItem.php?id=${id}`);
  }
  
  /**
   * Sell item
   * @param item 
   */
  sellItem(item: SellItem) {
    return this.http.post(`${this.baseUrl}/api/sales/sellItem.php`, item);
  }
  
  /**
   * Update sub item
   * @param sub_item
   */
  updateSubItem(sub_item: SubItem) {
    return this.http.post(`${this.baseUrl}/api/sub_item/updateSubItem.php`, sub_item); 
  }
}
