import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProcessingType {
  processing_type_id?: number;
  name: string;
  processing_charge: number;
  can_be_processed_further?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessingTypeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProcessingTypes(): Observable<{processing_types: ProcessingType[]}> {
    return this.http.get<{processing_types: ProcessingType[]}>(`${this.apiUrl}/api/processing_type/getProcessingTypes.php`);
  }

  addProcessingType(processingType: ProcessingType): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/processing_type/addProcessingType.php`, processingType);
  }

  updateProcessingType(processingType: ProcessingType): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/processing_type/updateProcessingType.php`, processingType);
  }

  deleteProcessingType(processingTypeId: number): Observable<any> {
    return this.http.request<any>('delete', `${this.apiUrl}/api/processing_type/deleteProcessingType.php`, {
      body: { processing_type_id: processingTypeId }
    });
  }
}

