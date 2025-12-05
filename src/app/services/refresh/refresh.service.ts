import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {
  private refreshSubject = new Subject<string>();
  
  // Observable that components can subscribe to
  refresh$ = this.refreshSubject.asObservable();
  
  /**
   * Trigger a refresh for a specific page/component
   * @param page The page/component to refresh (e.g., 'inventory', 'manufacturing', 'sales', 'purchase', 'all')
   */
  triggerRefresh(page: string = 'all'): void {
    this.refreshSubject.next(page);
  }
}

