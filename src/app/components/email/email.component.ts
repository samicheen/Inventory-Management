import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GapiSession } from 'src/app/sessions/gapi.session';
import { BehaviorSubject } from 'rxjs';
import { GoogleService } from 'src/app/services/google.service';

@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit {

  showSignIn = false;
  googleAuth: gapi.auth2.GoogleAuth;
  googleUser: gapi.auth2.GoogleUser;
  private readonly refreshItems = new BehaviorSubject(undefined);

  excelValues = []

  constructor(private gapiSession: GapiSession, private googleService: GoogleService) { }

  @ViewChild("send") sendView: ElementRef;

  ngOnInit(): void {
    this.updateSigninStatus(this.isSignedIn());
  }

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      this.showSignIn = false;
    } else {
      this.showSignIn = true;
    }
  }

  isSignedIn(){
    return this.gapiSession.isSignedIn;
  }

  /**
   *  Sign in the user upon button click.
   */
  async handleAuthClick() {
    const res = await this.gapiSession.signIn();
    console.log(typeof res);
  }

  /**
   * 
   */
  async sendEmails() {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1rYrDIeKC8IpDLnoxlM6UP4EF8S-r4DwkGjVqFxZTpAE',
      range: 'Emails!B2:B'
    });
    console.log(response.result.values);
    for (let email of response.result.values) {
      const emailStr = "To: " + email+ "\r\n";
      const message = emailStr +
        "Subject: How to Make Shot Blasting Process Profitable\r\n" +
        "Content-Type: text/html; charset=UTF-8\r\n" +
        "Content-Transfer-Encoding: base64\r\n\r\n" +
        this.sendView.nativeElement.innerHTML;

      // The body needs to be base64url encoded.
      const encodedMessage = btoa(message);

      const reallyEncodedMessage = encodedMessage.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      this.googleService.sendMail(reallyEncodedMessage, this.gapiSession.currentUser.getAuthResponse().access_token).subscribe(() => { console.log("done!")});
    }
  }
}
