import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Manufacture } from '../../models/manufacture.model';
import { Response } from '../../models/response.model';
import { map } from 'rxjs/operators';
import { AddItemResponse } from '../../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class ManufactureService {

  apiUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get items in Manufacturing
   */
  getManufacturingItems(): Observable<Response<Manufacture>> {
    return this.http.get<Response<Manufacture>>(`${this.apiUrl}/api/manufacture/getManufacturingItems.php`)
    .pipe(map((res: any) => {
      return {
        items: res.manufactures,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add item to manufactuing
   * @param sale 
   */
  addToManufacturing(manufacture: Manufacture): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/manufacture/addToManufacturing.php`, manufacture);
  }

  /**
   * Remove manufacturing entry
   * @param manufactureId 
   */
  removeManufacture(manufactureId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/manufacture/removeManufacture.php?manufacture_id=${manufactureId}`);
  }

  /**
   * Get packages for a manufacturing entry
   * @param manufactureId Optional manufacture ID
   * @param sourceBarcode Optional source barcode
   * @param itemId Optional item ID
   */
  getPackagesByManufacture(manufactureId?: string, sourceBarcode?: string, itemId?: string): Observable<any> {
    let params = new HttpParams();
    if (manufactureId) {
      params = params.append('manufacture_id', manufactureId);
    }
    if (sourceBarcode) {
      params = params.append('source_barcode', sourceBarcode);
    }
    if (itemId) {
      params = params.append('item_id', itemId);
    }
    return this.http.get<any>(`${this.apiUrl}/api/manufacture/getPackagesByManufacture.php`, { params });
  }
}