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

  baseUrl: string;
  items: Response<Item>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get items
   */
  getItems(): Observable<Response<Item>> {
    return this.http.get(`${this.baseUrl}/api/item/getItems.php`)
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
    return this.http.post<AddItemResponse>(`${this.baseUrl}/api/item/addItem.php`, item);
  }
}
