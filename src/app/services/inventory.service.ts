import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryResponse } from '../models/inventory.model';
import { Observable } from 'rxjs';
const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  baseUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get list of inventory
   */
  getInventory(): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${this.baseUrl}/api/inventory/getInventory.php`);
  }
}
