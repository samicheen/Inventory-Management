import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleService {

  private readonly API_URL: string = 'https://content.googleapis.com/gmail/v1/users/me/messages/send';

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Send Mail
   */
  sendMail(message, authtoken: string): Observable<any> {
    return this.http.post(this.API_URL,{ raw: message }, {
      headers: new HttpHeaders({
            Authorization: `Bearer ${authtoken}`
        })
    });
}
}
