import { Injectable, Inject } from '@angular/core';
import { Party } from '../../models/party.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../../models/response.model'
import { AddItemResponse } from '../../models/add-item-response.model';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class PartyService {

  apiUrl: string;
  items: Response<Party>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get parties
   */
  getParties(party_type: string): Observable<Response<Party>> {
    const endpoint = party_type === 'customer' 
      ? `${this.apiUrl}/api/customer/getCustomers.php`
      : `${this.apiUrl}/api/vendor/getVendors.php`;
    
    return this.http.get(endpoint)
    .pipe(map((res: any) => {
      return {
        items: res.parties,
        alerts: res.alerts || []
      };
    }));
  }

  /**
   * Add party (customer or vendor)
   * @param party
   */
  addParty(party: Party): Observable<AddItemResponse> {
    const endpoint = party.type === 'customer'
      ? `${this.apiUrl}/api/customer/addCustomer.php`
      : `${this.apiUrl}/api/vendor/addVendor.php`;
    
    return this.http.post<AddItemResponse>(endpoint, { name: party.name });
  }

  /**
   * Update party (customer or vendor)
   * @param party
   */
  updateParty(party: Party): Observable<AddItemResponse> {
    const endpoint = party.type === 'customer'
      ? `${this.apiUrl}/api/customer/updateCustomer.php`
      : `${this.apiUrl}/api/vendor/updateVendor.php`;
    
    const idField = party.type === 'customer' ? 'customer_id' : 'vendor_id';
    const dataField = party.type === 'customer' ? 'customer' : 'vendor';
    
    return this.http.put<AddItemResponse>(endpoint, { 
      [idField]: party.party_id,
      [dataField]: { name: party.name }
    });
  }

  /**
   * Remove party (customer or vendor)
   * @param party
   */
  removeParty(party: Party): Observable<any> {
    const id = party.party_id;
    const endpoint = party.type === 'customer'
      ? `${this.apiUrl}/api/customer/removeCustomer.php?customer_id=${id}`
      : `${this.apiUrl}/api/vendor/removeVendor.php?vendor_id=${id}`;
    
    return this.http.delete(endpoint);
  }
}
