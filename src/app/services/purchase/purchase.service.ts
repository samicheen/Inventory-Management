import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Response } from '../../models/response.model';
import { Observable } from 'rxjs';
import { AddItemResponse } from '../../models/add-item-response.model';
import { Purchase } from '../../models/purchase.model';
import { map } from 'rxjs/operators';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  apiUrl: string;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get purchases
   */
  getPurchases(): Observable<Response<Purchase>> {
    return this.http.get<Response<Purchase>>(`${this.apiUrl}/api/purchase/getPurchases.php`)
    .pipe(map((res: any) => {
      return {
        items: res.purchases,
        total_amount: res.total_amount,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add purchase
   * @param purchase Purchase to add
   */
  addPurchase(purchase: any): Observable<AddItemResponse> {
    // Transform the purchase data to match backend expectations
    // Frontend sends flat structure, backend expects nested objects
    const purchasePayload = {
      invoice_id: purchase.invoice_id,
      item: {
        item_id: purchase.item_id
      },
      vendor: {
        name: purchase.selected_vendor || (purchase.vendor && purchase.vendor.name) || purchase.vendor
      },
      quantity: purchase.quantity,
      rate: purchase.rate,
      amount: purchase.amount,
      timestamp: purchase.timestamp
    };
    
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/purchase/addPurchase.php`, purchasePayload);
  }

  /**
   * Update purchase
   * @param purchase Purchase to update
   */
  updatePurchase(purchase: any): Observable<AddItemResponse> {
    // Transform the purchase data to match backend expectations (same as addPurchase)
    const purchasePayload = {
      purchase_id: purchase.purchase_id,
      invoice_id: purchase.invoice_id,
      item: {
        item_id: purchase.item_id
      },
      vendor: {
        name: purchase.selected_vendor || (purchase.vendor && purchase.vendor.name) || purchase.vendor
      },
      quantity: purchase.quantity,
      rate: purchase.rate,
      amount: purchase.amount,
      timestamp: purchase.timestamp
    };
    
    return this.http.post<AddItemResponse>(`${this.apiUrl}/api/purchase/updatePurchase.php`, purchasePayload);
  }

  /**
   * Remove purchase
   * @param purchaseId Purchase ID to remove
   */
  removeItem(purchaseId) {
    return this.http.delete(`${this.apiUrl}/api/purchase/removePurchase.php?purchase_id=${purchaseId}`);
  }

  /**
   * Get processed quantities for a purchase (for UI validation hint)
   * @param barcode Purchase barcode
   */
  getProcessedQuantities(barcode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/purchase/getProcessedQuantities.php?barcode=${encodeURIComponent(barcode)}`);
  }

  /**
   * Receive purchase - add package details and create inventory
   * @param purchaseId Purchase ID
   * @param packages Array of package details (quantity, packaging_weight optional, net_quantity)
   * @param unit Unit of measurement (KG, NOS, LITRES)
   */
  receivePurchase(purchaseId: string, packages: any[], unit: string = 'KG'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/purchase/receivePurchase.php`, {
      purchase_id: purchaseId,
      packages: packages,
      unit: unit
    });
  }

  /**
   * Get packages for a purchase (for reprinting labels)
   * @param purchaseId Purchase ID
   */
  getPurchasePackages(purchaseId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/purchase/getPurchasePackages.php`, {
      purchase_id: purchaseId
    });
  }
}
