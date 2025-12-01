import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale } from '../../models/sale.model';
import { Response } from '../../models/response.model';
import { map } from 'rxjs/operators';
import { AddItemResponse } from '../../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  apiUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get Sales
   */
  getSales(): Observable<Response<Sale>> {
    return this.http.get<Response<Sale>>(`${this.apiUrl}/api/sales/getSales.php`)
    .pipe(map((res: any) => {
      return {
        items: res.sales,
        total_amount: res.total_amount,
        alerts: res.alerts
      };
    }));
  }

  sellItem(sale: Sale): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/sales/sellItem.php`, sale);
  }
}
