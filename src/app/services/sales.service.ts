import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesResponse } from '../models/sales-response.model';
const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  baseUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get Sales
   */
  getSales(): Observable<SalesResponse> {
    return this.http.get<SalesResponse>(`${this.baseUrl}/api/sales/getSales.php`);
  }
}
