import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  apiUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get customer-wise sales report
   * @param startDate Optional start date (YYYY-MM-DD)
   * @param endDate Optional end date (YYYY-MM-DD)
   */
  getCustomerWiseSales(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    
    return this.http.get<any>(`${this.apiUrl}/api/reports/getCustomerWiseSales.php`, { params });
  }

  /**
   * Get vendor-wise purchase report
   * @param startDate Optional start date (YYYY-MM-DD)
   * @param endDate Optional end date (YYYY-MM-DD)
   */
  getVendorWisePurchases(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    
    return this.http.get<any>(`${this.apiUrl}/api/reports/getVendorWisePurchases.php`, { params });
  }

  /**
   * Get item-wise sales report
   * @param startDate Optional start date (YYYY-MM-DD)
   * @param endDate Optional end date (YYYY-MM-DD)
   */
  getItemWiseSales(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    
    return this.http.get<any>(`${this.apiUrl}/api/reports/getItemWiseSales.php`, { params });
  }

  /**
   * Get item-wise purchase report
   * @param startDate Optional start date (YYYY-MM-DD)
   * @param endDate Optional end date (YYYY-MM-DD)
   */
  getItemWisePurchases(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    
    return this.http.get<any>(`${this.apiUrl}/api/reports/getItemWisePurchases.php`, { params });
  }

  /**
   * Get profit analysis report (sales vs purchase comparison)
   * @param startDate Optional start date (YYYY-MM-DD)
   * @param endDate Optional end date (YYYY-MM-DD)
   */
  getProfitAnalysis(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    
    return this.http.get<any>(`${this.apiUrl}/api/reports/getProfitAnalysis.php`, { params });
  }
}

