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

  baseUrl: string;
  items: Response<SummaryItem>;
  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment
  ) { 
    this.baseUrl = this.environment.baseUrl;
  }

  /**
   * Get summary
   */
  getSummary(): Observable<Response<SummaryItem>> {
    return this.http.get(`${this.baseUrl}/api/summary/getSummary.php`)
    .pipe(map((res: any) => {
      return {
        items: res.summary,
        alerts: res.alerts
      };
    }));
  }
}
