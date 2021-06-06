import { Inject, Injectable } from '@angular/core';
import { SummaryItem } from '../../models/summary.model';
import { Response } from '../../models/response.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const ENVIRONMENT = "environment";

@Injectable({
  providedIn: 'root'
})
export class SummaryService {

  apiUrl: string;
  items: Response<SummaryItem>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.apiUrl = this.environment.apiUrl;
  }

  /**
   * Get summary
   */
  getSummary(): Observable<Response<SummaryItem>> {
    return this.http.get(`${this.apiUrl}/api/summary/getSummary.php`)
    .pipe(map((res: any) => {
      return {
        items: res.summary,
        alerts: res.alerts
      };
    }));
  }
}
