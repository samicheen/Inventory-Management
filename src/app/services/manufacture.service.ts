import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Manufacture } from '../models/manufacture.model';
import { Response } from '../models/response.model';
import { map } from 'rxjs/operators';
import { AddItemResponse } from '../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class ManufactureService {

  baseUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get items in Manufacturing
   */
  getManufacturingItems(): Observable<Response<Manufacture>> {
    return this.http.get<Response<Manufacture>>(`${this.baseUrl}/api/manufacture/getManufacturingItems.php`)
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
    return this.http.post<AddItemResponse>(`${this.baseUrl}/api/manufacture/addToManufacturing.php`, manufacture);
  }
}