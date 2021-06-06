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

  baseUrl: string;
  items: Response<Party>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get parties
   */
  getParties(party_type: string): Observable<Response<Party>> {
    return this.http.get(`${this.baseUrl}/api/party/getParties.php?party_type=${party_type}`)
    .pipe(map((res: any) => {
      return {
        items: res.parties,
        alerts: res.alerts
      };
    }));
  }

  /**
   * Add party (customer or vendor)
   * @param party
   */
  addParty(party: Party): Observable<AddItemResponse> {
    return this.http.post<AddItemResponse>(`${this.baseUrl}/api/party/addParty.php`, party);
  }
}
